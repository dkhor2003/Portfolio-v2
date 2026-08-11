"use client"

import { useEffect, useRef } from "react"
import * as d3 from "d3"
import { loadGlobeData, type GlobeData } from "@/lib/globe-data"
import { drawWireframe } from "@/lib/globe-render"
import { heroPin, journey, type Pin } from "@/data/journey"
import { STACK_BELOW } from "@/hooks/use-media-query"
import { palette, rgba } from "@/lib/palette"

export interface GlobeSceneProps {
  /** Defaults to the theme's accent. */
  markerColor?: string
  /** Section the globe idles over. */
  heroId?: string
  /** Section the globe must be gone by. */
  exitBeforeId?: string
}

const DEG = Math.PI / 180
/** Degrees of idle spin per 60fps frame, matching the original hero globe. */
const SPIN = 0.5
/** Scrub time constant in seconds. Higher = looser, more elastic follow. */
const SCRUB = 0.085
/** Phase below which the hero globe still accepts a drag. */
const GRAB_UNTIL = 0.25
/** Pin caption timings, in milliseconds: per note, to type, to fade out. */
const NOTE_CYCLE = 4600
const NOTE_TYPE = 1000
const NOTE_FADE = 700

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
/** Signed shortest angular distance, in degrees. */
const shortest = (deg: number) => (((deg % 360) + 540) % 360) - 180

/** A parked state for the globe. Transitions interpolate between two of these. */
interface Frame {
  cx: number
  cy: number
  r: number
  /** d3 rotate target, or null for "spin freely" (hero and exit). */
  rot: [number, number] | null
  pin: Pin | null
  alpha: number
  /** The hero frame rides the scrolling hero section instead of the viewport. */
  heroAnchored?: boolean
}

/**
 * The globe, driven entirely by scroll position across the whole page.
 *
 * It idles in the hero (spinning, draggable), then walks a timeline of stops
 * from `data/journey`: for each one it flies to a placement, spins onto that
 * pin and locks there while the stop's card is on screen. Between stops it
 * unlocks and free-spins, so the travel reads as the globe turning to face a
 * new place. Past the last stop it drops and rolls off the bottom-right corner,
 * handing the page over to the about section.
 *
 * Everything is drawn on one canvas rather than CSS-transformed, so the globe
 * stays crisp at every size, and no React state changes while scrolling.
 */
export default function GlobeScene({
  markerColor,
  heroId = "hero",
  exitBeforeId = "skills",
}: GlobeSceneProps) {
  const layerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const hitRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const layer = layerRef.current
    const canvas = canvasRef.current
    const hit = hitRef.current
    if (!layer || !canvas || !hit) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    /** Accent, unless a caller pinned one. Re-read whenever the theme changes. */
    const accent = () => markerColor ?? rgba(palette().accent)
    /** Backing for text drawn over the wireframe — the page colour, opaque. */
    const backdrop = () => rgba(palette().ink, 0.95)

    let data: GlobeData | null = null
    let disposed = false

    /* ----- layout ------------------------------------------------- */

    let vw = 0
    let vh = 0
    let heroR = 1
    let heroCy = 0 // document coords; the live value subtracts scroll
    /** Parked states, in order: hero, ...stops, exit. */
    let frames: Frame[] = []
    /** Scroll band each frame is fully parked over. */
    let holdA: number[] = []
    let holdB: number[] = []

    const projection = d3.geoOrthographic().clipAngle(90)
    const path = d3.geoPath(projection, ctx)

    const measure = () => {
      vw = window.innerWidth
      vh = window.innerHeight
      // Below this the journey stops stack instead of sitting side by side.
      const wide = vw >= STACK_BELOW
      const short = Math.min(vw, vh)

      // Full-viewport canvas, repainted every frame — worth capping the pixel
      // budget so very large displays do not pay for a 4x backing store.
      const dpr = Math.min(window.devicePixelRatio || 1, vw * vh > 1_700_000 ? 1.5 : 2)
      const w = Math.round(vw * dpr)
      const h = Math.round(vh * dpr)
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
        canvas.style.width = `${vw}px`
        canvas.style.height = `${vh}px`
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const scrollY = window.scrollY
      const top = (id: string) => {
        const el = document.getElementById(id)
        if (!el) return null
        const rect = el.getBoundingClientRect()
        return { top: rect.top + scrollY, height: rect.height }
      }

      const hero = top(heroId) ?? { top: 0, height: vh }
      const exitBefore = top(exitBeforeId)

      // The hero reserves an empty box for the globe and moves it around as the
      // layout changes — beside the headline when there is room, beneath it once
      // the type would collide. Reading that box means the globe follows the
      // layout instead of re-deriving it from breakpoints that could disagree.
      const slot = document.getElementById("hero-globe-slot")?.getBoundingClientRect()
      let heroCx: number
      if (slot && slot.width > 1 && slot.height > 1) {
        heroR = Math.min(slot.width, slot.height) / 2.5
        heroCx = slot.left + slot.width / 2
        heroCy = slot.top + scrollY + slot.height / 2
      } else {
        const box = Math.max(200, Math.min(620, vw - 40, vh - 100))
        heroR = box / 2.5
        heroCx = vw / 2
        heroCy = hero.top + hero.height / 2
      }

      const stops = journey.map((stop) => {
        const place = (!wide && stop.placeSmall) || stop.place
        return {
          frame: {
            cx: place.x * vw,
            cy: place.y * vh,
            r: place.r * short,
            rot: [-stop.pin.lng, -stop.pin.lat] as [number, number],
            pin: stop.pin,
            alpha: 1,
          } satisfies Frame,
          anchor: (() => {
            const box = top(stop.id)
            return box ? box.top + box.height / 2 - vh / 2 : hero.top + hero.height
          })(),
        }
      })

      const exitR = short * 0.18

      frames = [
        {
          cx: heroCx,
          cy: 0, // filled in live
          r: heroR,
          rot: null,
          pin: heroPin,
          alpha: wide ? 0.7 : 0.55,
          heroAnchored: true,
        },
        ...stops.map((s) => s.frame),
        // Rolls out past the bottom-right corner.
        { cx: vw + exitR * 1.6, cy: vh - exitR * 0.45, r: exitR, rot: null, pin: null, alpha: 0 },
      ]

      const lastStop = stops.length ? stops[stops.length - 1].anchor : 0
      const exitAnchor = exitBefore ? exitBefore.top - vh * 0.2 : lastStop + vh
      const anchors = [0, ...stops.map((s) => s.anchor), exitAnchor]

      holdA = anchors.map((a) => a - vh * 0.2)
      holdB = anchors.map((a) => a + vh * 0.2)
      // The hero holds from the top of the document; the exit never ends.
      holdA[0] = -1e9
      holdB[0] = vh * 0.1
      holdA[anchors.length - 1] = exitAnchor
      holdB[anchors.length - 1] = 1e9

      // Sections can end up closer together than the hold bands assume (short
      // viewports, tall cards); split the difference rather than overlapping.
      for (let i = 1; i < anchors.length; i++) {
        if (holdA[i] <= holdB[i - 1]) {
          const mid = (holdB[i - 1] + holdA[i]) / 2
          holdB[i - 1] = mid - 30
          holdA[i] = mid + 30
        }
      }

      hit.style.width = `${heroR * 2}px`
      hit.style.height = `${heroR * 2}px`
    }

    /** Position on the timeline: whole numbers are parked frames. */
    const phaseAt = (y: number) => {
      if (y <= holdB[0]) return 0
      for (let i = 1; i < frames.length; i++) {
        if (y < holdA[i]) {
          const span = holdA[i] - holdB[i - 1]
          return i - 1 + (span > 0 ? clamp01((y - holdB[i - 1]) / span) : 1)
        }
        if (y <= holdB[i]) return i
      }
      return frames.length - 1
    }

    /* ----- scroll + interaction ----------------------------------- */

    let scrollTop = window.scrollY
    const onScroll = () => {
      scrollTop = window.scrollY
    }
    window.addEventListener("scroll", onScroll, { passive: true })

    // Rotation state, in d3 rotate() degrees.
    let lon = 0
    let lat = 0
    let dragging = false

    const onPointerDown = (event: PointerEvent) => {
      // Touch is left alone: the globe sits mid-screen on phones, and capturing
      // drags there would stop the page scrolling past it.
      if (event.pointerType === "touch") return
      event.preventDefault()
      dragging = true
      hit.setPointerCapture(event.pointerId)
      const startX = event.clientX
      const startY = event.clientY
      const startLon = lon
      const startLat = lat

      const onMove = (move: PointerEvent) => {
        lon = startLon + (move.clientX - startX) * 0.5
        lat = Math.max(-90, Math.min(90, startLat - (move.clientY - startY) * 0.5))
      }
      const onUp = () => {
        dragging = false
        hit.removeEventListener("pointermove", onMove)
        hit.removeEventListener("pointerup", onUp)
        hit.removeEventListener("pointercancel", onUp)
      }
      hit.addEventListener("pointermove", onMove)
      hit.addEventListener("pointerup", onUp)
      hit.addEventListener("pointercancel", onUp)
    }
    hit.addEventListener("pointerdown", onPointerDown)

    /* ----- drawing ------------------------------------------------ */

    let elapsedMs = 0

    /** Rings, dot and arrow. Returns the label anchor, or null if out of view. */
    const drawPinBody = (pin: Pin, alpha: number, s: number) => {
      const projected = projection([pin.lng, pin.lat])
      if (!projected) return null

      // Fade out as the location rotates past the horizon.
      const [rotLon, rotLat] = projection.rotate()
      const distance = d3.geoDistance([pin.lng, pin.lat], [-rotLon, -rotLat])
      const fade = clamp01((Math.PI / 2 - distance) / 0.35) * alpha
      if (fade <= 0.01) return null

      const [x, y] = projected
      ctx.save()
      ctx.strokeStyle = accent()
      ctx.fillStyle = accent()

      const pulse = (elapsedMs % 2200) / 2200
      ctx.lineWidth = 1.5 * s
      ctx.globalAlpha = fade * (1 - pulse) * 0.7
      ctx.beginPath()
      ctx.arc(x, y, (4 + pulse * 20) * s, 0, 2 * Math.PI)
      ctx.stroke()

      ctx.globalAlpha = fade
      ctx.beginPath()
      ctx.arc(x, y, 4.5 * s, 0, 2 * Math.PI)
      ctx.fill()

      const tipY = y - 14 * s
      const tailY = y - 52 * s
      ctx.lineWidth = 2 * s
      ctx.beginPath()
      ctx.moveTo(x, tailY)
      ctx.lineTo(x, tipY)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(x, y - 7 * s)
      ctx.lineTo(x - 6.5 * s, tipY - 3 * s)
      ctx.lineTo(x + 6.5 * s, tipY - 3 * s)
      ctx.closePath()
      ctx.fill()
      ctx.restore()

      return { x, y: tailY - 9 * s, dotY: y, fade }
    }

    /**
     * Types a caption out under the pin, cycling through the pin's notes. The
     * hero pin uses it to say outright that this is where I am now — the label
     * alone only names a place, it does not claim it.
     */
    const drawNote = (x: number, y: number, notes: string[], alpha: number, s: number) => {
      const note = notes[Math.floor(elapsedMs / NOTE_CYCLE) % notes.length]
      const t = elapsedMs % NOTE_CYCLE
      const shown = note.slice(0, Math.round(clamp01(t / NOTE_TYPE) * note.length))
      // Fade the whole line out before the next one starts typing.
      const out = 1 - clamp01((t - (NOTE_CYCLE - NOTE_FADE)) / NOTE_FADE)
      const a = alpha * out
      if (a <= 0.02) return

      ctx.save()
      ctx.globalAlpha = a
      ctx.font = `${12 * s}px ui-monospace, SFMono-Regular, Menlo, monospace`
      // Left-aligned from where the finished line would start, so characters
      // land in place instead of the whole line shuffling as it types.
      ctx.textAlign = "left"
      ctx.textBaseline = "top"
      const startX = x - ctx.measureText(note).width / 2
      const shownW = ctx.measureText(shown).width
      const caretOn = shown.length < note.length || elapsedMs % 940 < 470
      const w = shownW + (caretOn ? 7 * s : 0)

      // A backing chip, grown to whatever has been typed so far. Without it the
      // caption is unreadable over the halftone dots.
      const padX = 7 * s
      const padY = 4 * s
      const h = 13 * s
      ctx.fillStyle = rgba(palette().ink, 0.78)
      ctx.beginPath()
      if (ctx.roundRect) ctx.roundRect(startX - padX, y - padY, w + padX * 2, h + padY * 2, 4 * s)
      else ctx.rect(startX - padX, y - padY, w + padX * 2, h + padY * 2)
      ctx.fill()

      ctx.fillStyle = rgba(palette().fg, 0.88)
      ctx.fillText(shown, startX, y)
      if (caretOn) ctx.fillRect(startX + shownW + 2 * s, y + 1.5 * s, 4 * s, 11 * s)
      ctx.restore()
    }

    const drawLabel = (x: number, y: number, text: string, alpha: number, s: number) => {
      if (alpha <= 0.01) return
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.fillStyle = accent()
      ctx.font = `700 ${18 * s}px ui-monospace, SFMono-Regular, Menlo, monospace`
      ctx.textAlign = "center"
      ctx.textBaseline = "bottom"
      ctx.letterSpacing = `${1.5 * s}px`
      ctx.shadowColor = backdrop()
      ctx.shadowBlur = 12 * s
      // Two passes thicken the glyphs against the busy wireframe.
      ctx.fillText(text, x, y)
      ctx.fillText(text, x, y)
      ctx.restore()
    }

    /**
     * Two neighbouring stops in the same city (Ames → Urbandale) are a couple of
     * pixels apart at globe scale, so cross-fading their pins would just look
     * like a smudge. Close pins glide as one and swap labels; distant ones
     * cross-fade, since they are on opposite sides of the sphere anyway.
     */
    const drawPins = (a: Pin | null, b: Pin | null, t: number, e: number, s: number, fade: number) => {
      if (fade <= 0.01) return
      if (a && b) {
        const apart = d3.geoDistance([a.lng, a.lat], [b.lng, b.lat]) / DEG
        if (apart < 6) {
          const glided: Pin = {
            lng: lerp(a.lng, b.lng, e),
            lat: lerp(a.lat, b.lat, e),
            label: a.label,
          }
          const anchor = drawPinBody(glided, fade, s)
          if (!anchor) return
          if (a.label === b.label) drawLabel(anchor.x, anchor.y, a.label, anchor.fade, s)
          else {
            drawLabel(anchor.x, anchor.y, a.label, anchor.fade * (1 - t), s)
            drawLabel(anchor.x, anchor.y, b.label, anchor.fade * t, s)
          }
          // Iowa and Wichita are close enough to glide as one pin, so the hero's
          // caption has to be handled here too — it fades out as the glide runs.
          const lead = t < 0.5 ? a : b
          if (lead.notes) {
            drawNote(anchor.x, anchor.dotY + 16 * s, lead.notes, anchor.fade * clamp01(1 - t * 2), s)
          }
          return
        }
      }
      for (const [pin, alpha] of [
        [a, 1 - t],
        [b, t],
      ] as const) {
        if (!pin || alpha * fade <= 0.01) continue
        const anchor = drawPinBody(pin, alpha * fade, s)
        if (!anchor) continue
        drawLabel(anchor.x, anchor.y, pin.label, anchor.fade, s)
        if (pin.notes) drawNote(anchor.x, anchor.dotY + 16 * s, pin.notes, anchor.fade, s)
      }
    }

    /** Instrument ring, on only while the globe is locked onto a stop. */
    const drawReticle = (cx: number, cy: number, r: number, lock: number) => {
      if (lock < 0.02) return
      ctx.save()
      ctx.strokeStyle = rgba(palette().line)
      ctx.globalAlpha = lock * 0.22 * palette().lineAlpha
      ctx.lineWidth = 1
      ctx.setLineDash([2, 12])
      ctx.lineDashOffset = -elapsedMs * 0.006
      ctx.beginPath()
      ctx.arc(cx, cy, r * 1.09, 0, 2 * Math.PI)
      ctx.stroke()
      ctx.setLineDash([])

      ctx.strokeStyle = accent()
      ctx.globalAlpha = lock * 0.55
      ctx.lineWidth = 1.5
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2 + Math.PI / 4
        const ca = Math.cos(a)
        const sa = Math.sin(a)
        ctx.beginPath()
        ctx.moveTo(cx + ca * r * 1.05, cy + sa * r * 1.05)
        ctx.lineTo(cx + ca * r * 1.13, cy + sa * r * 1.13)
        ctx.stroke()
      }
      ctx.restore()
    }

    const render = (
      cx: number,
      cy: number,
      r: number,
      lock: number,
      pins: { a: Pin | null; b: Pin | null; t: number; e: number; fade: number },
      roll: number,
    ) => {
      ctx.clearRect(0, 0, vw, vh)
      // Line weights grow with the globe, but only part way — hairlines at this
      // size would disappear, full scaling would look clumsy.
      const s = lerp(1, r / heroR, 0.65)

      ctx.save()
      if (roll > 0) {
        // Squash and stretch on the way out, so the roll has some bounce.
        const sy = 1 - 0.09 * Math.sin(roll * Math.PI * 2)
        ctx.translate(cx, cy)
        ctx.scale(1 / sy, sy)
        ctx.translate(-cx, -cy)

        // Speed lines: a couple of ghosts trailing back up the path.
        ctx.strokeStyle = rgba(palette().line)
        ctx.lineWidth = 1
        for (let i = 1; i <= 2; i++) {
          ctx.globalAlpha = 0.12 * roll * (1 - i * 0.35)
          ctx.beginPath()
          ctx.arc(cx - r * 0.5 * i * roll, cy - r * 0.22 * i * roll, r, 0, 2 * Math.PI)
          ctx.stroke()
        }
        ctx.globalAlpha = 1
      }

      // Accent bloom behind the sphere, strongest once it is locked on.
      if (lock > 0.01) {
        const glow = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r * 1.5)
        const a = palette().accent
        glow.addColorStop(0, rgba(a, 0.1 * lock))
        glow.addColorStop(1, rgba(a, 0))
        ctx.fillStyle = glow
        ctx.fillRect(cx - r * 1.5, cy - r * 1.5, r * 3, r * 3)
      }

      // Dots on the far side stay visible while the globe spins — that
      // see-through wireframe is the look — but fade out as it locks onto a
      // stop, so the parked frame reads cleanly as one place.
      drawWireframe(ctx, {
        data,
        path,
        cx,
        cy,
        r,
        lon,
        lat,
        s,
        backAlpha: lerp(0.85, 0.06, lock),
        landAlpha: lerp(0.5, 0.72, lock),
        vw,
        vh,
      })
      if (data) drawPins(pins.a, pins.b, pins.t, pins.e, s, pins.fade)

      drawReticle(cx, cy, r, lock)
      ctx.restore()
    }

    /* ----- the loop ----------------------------------------------- */

    let phase = 0
    let primed = false
    let visible = true
    let last = 0

    const tick = (elapsed: number) => {
      if (disposed || frames.length < 2) return
      const dtMs = last === 0 ? 16.7 : Math.min(elapsed - last, 64)
      last = elapsed
      elapsedMs = elapsed
      const dt = dtMs / 1000

      // First frame snaps, so a reload part-way down the page does not replay
      // the whole journey at once.
      const target = phaseAt(scrollTop)
      const k = primed ? 1 - Math.exp(-dt / SCRUB) : 1
      phase += (target - phase) * k

      const i = Math.max(0, Math.min(frames.length - 2, Math.floor(phase)))
      const t = clamp01(phase - i)
      const A = frames[i]
      const B = frames[i + 1]
      const isExit = i === frames.length - 2
      const e = easeInOut(t)

      const alpha = lerp(A.alpha, B.alpha, isExit ? Math.pow(t, 5) : e)
      if (!primed) {
        primed = true
        // Land on the right rotation immediately rather than unwinding to it.
        const snap = t < 0.5 ? A.rot : B.rot
        if (snap) {
          lon = snap[0]
          lat = snap[1]
        }
      }

      if (alpha <= 0.004) {
        if (visible) {
          layer.style.visibility = "hidden"
          hit.style.pointerEvents = "none"
          visible = false
        }
        return
      }
      if (!visible) {
        layer.style.visibility = "visible"
        visible = true
      }
      layer.style.opacity = alpha.toFixed(3)

      // The hero anchor drifts at half scroll speed. It reads as parallax, and
      // it keeps the globe from clipping off the top of the screen mid-flight,
      // when it is already large but still following the hero up the page.
      const ay = A.heroAnchored ? heroCy - scrollTop * 0.55 : A.cy
      const by = B.heroAnchored ? heroCy - scrollTop * 0.55 : B.cy

      // The exit drops before it rolls: y settles early, x accelerates away.
      const eX = isExit ? t * t : e
      const eY = isExit ? 1 - (1 - t) * (1 - t) : e
      const cx = lerp(A.cx, B.cx, eX)
      const cy = lerp(ay, by, eY)
      const r = lerp(A.r, B.r, isExit ? t : e)

      // Dragging is a hero affordance only; once the journey starts, scroll owns
      // the rotation.
      const grabbable = phase < GRAB_UNTIL
      hit.style.pointerEvents = grabbable ? "auto" : "none"
      if (grabbable) hit.style.transform = `translate3d(${cx - heroR}px, ${cy - heroR}px, 0)`

      // Magnet: full strength at either end of a transition, nothing in the
      // middle, so the globe free-spins between stops and locks onto each one.
      // Symmetric, which is what makes scrolling back up run in reverse.
      const near = t < 0.5 ? A : B
      const lock = near.rot ? Math.pow(t < 0.5 ? 1 - 2 * t : 2 * t - 1, 2) : 0

      // Two stops in the same city share a rotation; without this the globe
      // would take a lap between them just because the magnet let go.
      let swing = 1
      if (A.rot && B.rot) {
        const apart = Math.abs(shortest(B.rot[0] - A.rot[0])) + Math.abs(B.rot[1] - A.rot[1])
        swing = clamp01(apart / 45)
      }

      if (!dragging) {
        if (!reduced) {
          // The roll-off spins up hard, like a wheel getting away from you.
          const boost = isExit ? 1 + 14 * t * t : 1
          lon += SPIN * (dtMs / 16.667) * (1 - lock) * swing * boost
        }
        if (near.rot) {
          const pull = 1 - Math.exp(-dt * 9 * lock)
          lon += shortest(near.rot[0] - lon) * pull
          lat += (near.rot[1] - lat) * pull
        }
      }

      projection.scale(r).translate([cx, cy]).rotate([lon, lat])
      // The pin is dropped early on the way out: the squash-and-stretch below
      // would smear the label, and a tumbling globe has no "you are here".
      const pinFade = isExit ? clamp01(1 - t * 3) : 1
      render(cx, cy, r, lock, { a: A.pin, b: B.pin, t, e, fade: pinFade }, isExit ? t : 0)
    }

    measure()
    const timer = d3.timer(tick)

    loadGlobeData().then(
      (loaded) => {
        if (!disposed) {
          data = loaded
          measure()
        }
      },
      (err) => console.warn("[GlobeScene]", err),
    )

    const onResize = () => measure()
    window.addEventListener("resize", onResize)
    // Section offsets shift as fonts load and cards animate, so track the
    // document box rather than measuring only on resize.
    const observer = new ResizeObserver(onResize)
    observer.observe(document.body)

    return () => {
      disposed = true
      timer.stop()
      observer.disconnect()
      window.removeEventListener("resize", onResize)
      window.removeEventListener("scroll", onScroll)
      hit.removeEventListener("pointerdown", onPointerDown)
    }
  }, [heroId, exitBeforeId, markerColor])

  return (
    <>
      <div ref={layerRef} aria-hidden className="fixed inset-0 z-0 pointer-events-none">
        <canvas ref={canvasRef} className="absolute inset-0" />
      </div>
      {/* Circular hit area over the idling globe. It has to sit *above* the
          page sections rather than inside the canvas layer: the hero section is
          z-10 and covers the viewport, so it would swallow the drag before it
          ever reached a handle painted underneath it. Only enabled while the
          globe idles in the hero, so it never blocks the journey below. */}
      <div
        ref={hitRef}
        aria-hidden
        data-globe-grab
        className="fixed left-0 top-0 z-20 rounded-full cursor-grab active:cursor-grabbing"
        style={{ pointerEvents: "none" }}
      />
    </>
  )
}
