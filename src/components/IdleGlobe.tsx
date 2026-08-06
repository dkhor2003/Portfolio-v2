import { useEffect, useRef } from "react"
import * as d3 from "d3"
import { loadGlobeData, type GlobeData } from "@/lib/globe-data"
import { drawWireframe } from "@/lib/globe-render"

export interface IdleGlobeProps {
  /** Milliseconds between question-mark spawns. */
  spawnEvery?: number
  /** How long each mark stays before fading out, in milliseconds. */
  markLife?: number
  markColor?: string
  className?: string
}

/** Degrees of spin per 60fps frame — the same drift as the hero globe. */
const SPIN = 0.5
const DEG = Math.PI / 180

interface Mark {
  lng: number
  lat: number
  born: number
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

/**
 * A globe that just spins, with no scroll timeline attached — used on the 404
 * page. Draggable like the hero one, and it drops question marks at random
 * visible coordinates, as if scanning for a location that isn't there.
 *
 * Fills its parent, so size it from the outside.
 */
export default function IdleGlobe({
  spawnEvery = 2000,
  markLife = 3000,
  markColor = "#4dd9d0",
  className,
}: IdleGlobeProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const host = hostRef.current
    const canvas = canvasRef.current
    if (!host || !canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    let data: GlobeData | null = null
    let disposed = false
    let w = 0
    let h = 0
    let cx = 0
    let cy = 0
    let r = 1

    const projection = d3.geoOrthographic().clipAngle(90)
    const path = d3.geoPath(projection, ctx)

    const measure = () => {
      w = host.clientWidth
      h = host.clientHeight
      if (!w || !h) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      cx = w / 2
      cy = h / 2
      r = Math.min(w, h) * 0.42
    }

    /* ----- drag ---------------------------------------------------- */

    let lon = -30
    let lat = -12
    let dragging = false

    const onPointerDown = (event: PointerEvent) => {
      // Touch is left alone so the page can still be scrolled over the globe.
      if (event.pointerType === "touch") return
      event.preventDefault()
      dragging = true
      canvas.setPointerCapture(event.pointerId)
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
        canvas.removeEventListener("pointermove", onMove)
        canvas.removeEventListener("pointerup", onUp)
        canvas.removeEventListener("pointercancel", onUp)
      }
      canvas.addEventListener("pointermove", onMove)
      canvas.addEventListener("pointerup", onUp)
      canvas.addEventListener("pointercancel", onUp)
    }
    canvas.addEventListener("pointerdown", onPointerDown)

    /* ----- question marks ------------------------------------------ */

    const marks: Mark[] = []
    let lastSpawn = 0

    /**
     * Picks a point on the hemisphere currently facing the viewer by choosing a
     * random spot inside the drawn disc and un-projecting it. Spawning in
     * lat/lng instead would put half the marks on the far side, where they
     * would never be seen.
     */
    const spawn = () => {
      const angle = Math.random() * 2 * Math.PI
      // A ring, not the whole disc: the middle of the globe sits behind the
      // page's copy, and marks landing there would never be seen. The outer
      // limit keeps them off the rim, where they foreshorten into smears.
      const radius = r * (0.46 + 0.39 * Math.sqrt(Math.random()))
      const point = projection.invert?.([cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)])
      if (point && Number.isFinite(point[0]) && Number.isFinite(point[1])) {
        marks.push({ lng: point[0], lat: point[1], born: performance.now() })
      }
    }

    const drawMark = (mark: Mark, now: number, s: number) => {
      const age = (now - mark.born) / 1000
      const life = markLife / 1000
      // Ease in fast, hold, then fade out.
      const alive = clamp01(age / 0.28) * clamp01((life - age) / 0.5)
      if (alive <= 0.01) return

      const projected = projection([mark.lng, mark.lat])
      if (!projected) return

      // Fade out as the coordinate rotates past the horizon.
      const [rotLon, rotLat] = projection.rotate()
      const distance = d3.geoDistance([mark.lng, mark.lat], [-rotLon, -rotLat])
      const alpha = clamp01((Math.PI / 2 - distance) / 0.3) * alive
      if (alpha <= 0.01) return

      const [x, y] = projected
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.fillStyle = markColor
      ctx.strokeStyle = markColor

      // Ping ring on arrival, expanding once and fading.
      const ping = clamp01(age / 0.75)
      if (ping < 1) {
        ctx.globalAlpha = alpha * (1 - ping) * 0.8
        ctx.lineWidth = 1.5 * s
        ctx.beginPath()
        ctx.arc(x, y, (5 + ping * 26) * s, 0, 2 * Math.PI)
        ctx.stroke()
        ctx.globalAlpha = alpha
      }

      // Anchor dot, with the glyph sitting above it.
      ctx.beginPath()
      ctx.arc(x, y, 2.6 * s, 0, 2 * Math.PI)
      ctx.fill()

      const pop = 0.72 + 0.28 * clamp01(age / 0.28)
      ctx.font = `700 ${30 * s * pop}px ui-monospace, SFMono-Regular, Menlo, monospace`
      ctx.textAlign = "center"
      ctx.textBaseline = "bottom"
      ctx.shadowColor = "rgba(10, 10, 15, 0.95)"
      ctx.shadowBlur = 10 * s
      // Two passes thicken the glyph against the busy wireframe.
      ctx.fillText("?", x, y - 9 * s)
      ctx.fillText("?", x, y - 9 * s)
      ctx.restore()
    }

    /* ----- loop ---------------------------------------------------- */

    let lastFrame = 0

    const tick = (elapsed: number) => {
      if (disposed || !w || !h) return
      const dtFrames = lastFrame ? Math.min((elapsed - lastFrame) / 16.667, 4) : 1
      lastFrame = elapsed
      const now = performance.now()

      if (!dragging && !reduced) lon += SPIN * dtFrames

      if (now - lastSpawn >= spawnEvery) {
        lastSpawn = now
        spawn()
      }
      // Drop expired marks. They are appended in order, so the oldest is first.
      while (marks.length && now - marks[0].born > markLife) marks.shift()

      projection.scale(r).translate([cx, cy]).rotate([lon, lat])
      ctx.clearRect(0, 0, w, h)

      // Line weights are tuned around the hero globe's 248px radius.
      const s = 1 + (r / 248 - 1) * 0.65

      drawWireframe(ctx, {
        data,
        path,
        cx,
        cy,
        r,
        lon,
        lat,
        s,
        backAlpha: 0.85,
        landAlpha: 0.5,
        vw: w,
        vh: h,
      })
      for (const mark of marks) drawMark(mark, now, s)
    }

    measure()
    const timer = d3.timer(tick)

    loadGlobeData().then(
      (loaded) => {
        if (!disposed) data = loaded
      },
      (err) => console.warn("[IdleGlobe]", err),
    )

    const observer = new ResizeObserver(measure)
    observer.observe(host)

    return () => {
      disposed = true
      timer.stop()
      observer.disconnect()
      canvas.removeEventListener("pointerdown", onPointerDown)
    }
  }, [spawnEvery, markLife, markColor])

  return (
    <div ref={hostRef} className={className}>
      <canvas ref={canvasRef} className="cursor-grab active:cursor-grabbing touch-none" />
    </div>
  )
}
