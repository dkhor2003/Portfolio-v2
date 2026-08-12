import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { useReducedMotion } from 'motion/react'
import { loadGlobeData, type GlobeData } from '@/lib/globe-data'
import { drawWireframe } from '@/lib/globe-render'
import { contactGlobe } from '@/lib/globe-stage'
import { palette, rgba } from '@/lib/palette'
import HoloFrame from './HoloFrame'
import { projects, projectImage, type Project } from '../data/projects'
import { skillBySlug } from '../data/skills'
import { GitHubIcon } from './SocialIcons'

const N = projects.length
/** Radians between neighbouring project nodes on the rim. */
const STEP = (Math.PI * 2) / N
/** Scroll-follow time constant, in seconds. Higher = heavier, more inertia. */
const SCRUB = 0.11
/** Screen angle of the emitter: straight up from the globe's centre. */
const TOP = -Math.PI / 2

/** Where the globe's apex sits while it is projecting, as a fraction of vh. */
const PROJECTING_APEX = 0.62
/**
 * The panel grows upward from the beam and has to clear the section heading.
 * On a short viewport there is not enough room between the two, so the globe
 * drops and takes the beam with it, opening the space the panel needs.
 */
const projectingApex = (vh: number) => (vh < 880 ? 0.72 : PROJECTING_APEX)
/** Where its lowest point sits once it has risen over the contact section. */
const CONTACT_NADIR = 0.42
/**
 * Radius as a fraction of vh. Under 0.5 so the whole sphere fits on screen
 * during the climb — the globe has to read as one complete object whose top
 * half you saw over the projects and whose bottom half ends up over the
 * contact form.
 */
const RADIUS = 0.44

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const smoothstep = (v: number) => v * v * (3 - 2 * v)
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
/** Signed shortest angular distance, in radians. */
const shortest = (a: number) => {
  const t = ((a % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2)
  return t - Math.PI
}

interface Mote {
  /** Offset from the beam axis at the emitter, in px. */
  spread: number
  /** Height above the emitter, 0–1 of the beam length. */
  rise: number
  speed: number
  size: number
}

/**
 * Selected work, projected — and the globe's last act.
 *
 * The globe climbs the page on a fixed layer: it rises from below the fold,
 * parks with its apex at 62% of the screen while the projects roll past, then
 * keeps climbing until only its underside hangs over the contact section. It is
 * one sphere the whole way, small enough that the complete globe is on screen
 * mid-climb, so the two halves read as the same object rather than two domes.
 *
 * While it is parked, project nodes ride its rim; whichever reaches the apex
 * fires the projector and the holographic panel resolves into that project.
 * Between nodes the light defocuses and the panel dissolves, which is also when
 * the content swaps, so the change is never seen.
 *
 * The light is all soft gradient — no drawn rays. Real projector light has no
 * edges; it falls off into the room.
 */
export default function ProjectHologram() {
  const sectionRef = useRef<HTMLElement>(null)
  const layerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const reduce = useReducedMotion()

  useEffect(() => {
    if (reduce) return
    const section = sectionRef.current
    const layer = layerRef.current
    const canvas = canvasRef.current
    const panel = panelRef.current
    if (!section || !layer || !canvas || !panel) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let data: GlobeData | null = null
    let disposed = false
    let raf = 0

    /* ----- layout ------------------------------------------------- */

    let vw = 0
    let vh = 0
    let cx = 0
    let r = 1
    let apex = PROJECTING_APEX
    /** Beam length from the apex up to the top of the panel. */
    let beamLen = 0

    // Document scroll anchors for the climb.
    let riseFrom = 0
    let projStart = 0
    let projEnd = 0
    let contactTop = 0
    let fadeStart = 0
    let fadeEnd = 0

    const projection = d3.geoOrthographic().clipAngle(90)
    const path = d3.geoPath(projection, ctx)

    const measure = () => {
      vw = window.innerWidth
      vh = window.innerHeight
      const dpr = Math.min(window.devicePixelRatio || 1, vw * vh > 1_700_000 ? 1.5 : 2)
      canvas.width = Math.round(vw * dpr)
      canvas.height = Math.round(vh * dpr)
      canvas.style.width = `${vw}px`
      canvas.style.height = `${vh}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      cx = vw / 2
      r = vh * RADIUS
      apex = projectingApex(vh)
      beamLen = vh * apex * 0.92

      const scrollY = window.scrollY
      const rect = section.getBoundingClientRect()
      projStart = rect.top + scrollY
      projEnd = projStart + rect.height - vh

      const contact = document.getElementById('contact')?.getBoundingClientRect()
      contactTop = contact ? contact.top + scrollY : projEnd + vh

      riseFrom = projStart - vh * 0.85
      // Recedes — but never vanishes — as the form comes up. The page ends
      // shortly after the contact section, so a fade-to-nothing would need more
      // scroll than is left; this dims within what is actually reachable.
      const maxScroll = document.documentElement.scrollHeight - vh
      fadeStart = contactTop + vh * 0.3
      fadeEnd = Math.max(fadeStart + vh * 0.4, maxScroll)

      // The panel hangs just above the parked apex, centred on the beam.
      panel.style.left = `${cx}px`
      panel.style.top = `${vh * apex - vh * 0.08}px`

      fitPanel()
    }

    /**
     * Keeps the panel inside the room between the section's heading and the
     * globe. The panel grows upward from the beam, so a tall screenshot pushes
     * its top into the heading — measure what actually overflows and take it off
     * the image, which is the only part that can give.
     *
     * Two passes: the cap has to be released before measuring, or the previous
     * frame's cap is what gets measured.
     */
    /**
     * Sizes the card, and picks the arrangement that yields the bigger image.
     *
     * Stacking the text under the screenshot costs height, which is the scarce
     * axis; setting it beside costs width, which is plentiful on a wide screen
     * and absent on a narrow one. Rather than guess a breakpoint, both are
     * costed out against the room actually available and the better one wins.
     */
    const fitPanel = () => {
      const shot = panel.querySelector<HTMLImageElement>('[data-shot]')
      const wrap = panel.querySelector<HTMLElement>('[data-wrap]')
      const meta = panel.querySelector<HTMLElement>('[data-meta]')
      const frame = panel.querySelector<HTMLElement>('[data-frame]')
      if (!shot || !wrap || !meta || !frame || !shot.naturalWidth) return

      const ratio = shot.naturalWidth / shot.naturalHeight
      const GAP = 24
      const SIDE_TEXT = 272

      // Measure with every cap released, or the previous frame's numbers are
      // what get measured.
      panel.style.width = ''
      frame.style.width = ''
      wrap.style.flexDirection = 'column'
      meta.style.width = ''
      shot.style.height = ''
      const cssWidth = panel.offsetWidth
      // Everything that is not the screenshot — slug row, metadata and the gaps.
      // Measuring the metadata alone under-counts and the card runs into the
      // heading.
      const stackedChrome = panel.offsetHeight - shot.offsetHeight

      const hud = section.querySelector('[data-hud]')?.getBoundingClientRect()
      const floor = vh * apex - vh * 0.08
      // The heading sits far left, so a card that clears it sideways gets the
      // full height; only one wide enough to reach it is pushed below it.
      const ceilingFor = (width: number) =>
        !hud || cx - width / 2 > hud.right + 16 ? 96 : hud.bottom + 24

      const stackHeight = Math.min(cssWidth / ratio, floor - ceilingFor(cssWidth) - stackedChrome)
      const sideMax = Math.min(cssWidth, hud ? Math.max(320, 2 * (cx - hud.right - 16)) : cssWidth)
      const sideHeight = Math.min((sideMax - SIDE_TEXT - GAP) / ratio, floor - ceilingFor(sideMax))

      const side = sideHeight > stackHeight
      let height = Math.max(90, side ? sideHeight : stackHeight)

      const apply = (h: number) => {
        const w = Math.round(h * ratio)
        wrap.style.flexDirection = side ? 'row' : 'column'
        wrap.style.alignItems = side ? 'center' : 'stretch'
        meta.style.width = side ? `${SIDE_TEXT}px` : ''
        meta.style.flexShrink = side ? '0' : ''
        // The frame carries the width: as a flex child it would otherwise be
        // shrunk by the layout, and Tailwind's `img { max-width: 100% }` would
        // then clip the picture's width while its height stayed — squashing it.
        frame.style.width = `${w}px`
        shot.style.height = `${Math.round(h)}px`
        panel.style.width = `${w + (side ? SIDE_TEXT + GAP : 0)}px`
      }

      apply(height)
      // Text rewraps at the settled width, so the card can come out taller than
      // predicted. Correct once against what it actually measures.
      const overshoot = ceilingFor(panel.offsetWidth) - panel.getBoundingClientRect().top
      if (overshoot > 1) apply(Math.max(90, height - overshoot))
    }

    /* ----- motes -------------------------------------------------- */

    const motes: Mote[] = Array.from({ length: 22 }, () => ({
      spread: (Math.random() * 2 - 1) * 44,
      rise: Math.random(),
      speed: 0.07 + Math.random() * 0.12,
      size: 0.7 + Math.random() * 1.5,
    }))

    /* ----- light -------------------------------------------------- */

    /**
     * The projector's colours. Additive blending only brightens a dark page —
     * over paper it saturates to nothing — so the light theme swaps to normal
     * compositing with a saturated accent, which reads as a tinted shaft rather
     * than a glow, and leans on stronger alphas to stay visible.
     */
    const beam = () => {
      const p = palette()
      return p.dark
        ? {
            op: 'lighter' as GlobalCompositeOperation,
            core: [255, 255, 255] as [number, number, number],
            hot: [175, 240, 255] as [number, number, number],
            mid: [120, 210, 255] as [number, number, number],
            far: [70, 150, 235] as [number, number, number],
            gain: 1,
          }
        : {
            op: 'source-over' as GlobalCompositeOperation,
            core: p.accent,
            hot: p.accent,
            mid: p.accent,
            far: p.accent,
            gain: 1.5,
          }
    }

    /**
     * Draws a soft elliptical falloff. Canvas gradients are radial only, so the
     * context is scaled to stretch the circle into the column shape — that
     * keeps the edges genuinely soft instead of clipped to a path.
     */
    const glowEllipse = (
      x: number,
      y: number,
      rx: number,
      ry: number,
      stops: [number, string][],
    ) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.scale(1, ry / rx)
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, rx)
      for (const [at, color] of stops) grad.addColorStop(at, color)
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(0, 0, rx, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }

    /** The whole projector output: bloom, column, spill. No hard edges anywhere. */
    const drawLight = (apexY: number, intensity: number, time: number) => {
      if (intensity <= 0.004) return
      const breathe = 0.93 + 0.07 * Math.sin(time * 0.0011)
      const b = beam()
      const i = intensity * breathe * b.gain

      ctx.save()
      ctx.globalCompositeOperation = b.op

      // Wide, very faint haze — this is what dissolves into the page.
      glowEllipse(cx, apexY - beamLen * 0.3, Math.min(vw * 0.42, 560), beamLen * 1.5, [
        [0, rgba(b.far, 0.09 * i)],
        [0.5, rgba(b.far, 0.035 * i)],
        [1, rgba(b.far, 0)],
      ])

      // The column proper, tighter and cooler.
      glowEllipse(cx, apexY - beamLen * 0.42, Math.min(vw * 0.2, 260), beamLen * 1.15, [
        [0, rgba(b.mid, 0.17 * i)],
        [0.45, rgba(b.mid, 0.07 * i)],
        [1, rgba(b.mid, 0)],
      ])

      // Bright throat just above the emitter.
      glowEllipse(cx, apexY - beamLen * 0.14, Math.min(vw * 0.09, 120), beamLen * 0.42, [
        [0, rgba(b.hot, 0.3 * i)],
        [0.5, rgba(b.hot, 0.11 * i)],
        [1, rgba(b.hot, 0)],
      ])

      // The source itself.
      const core = 46 * breathe
      glowEllipse(cx, apexY, core * 2.6, core * 2.1, [
        [0, rgba(b.core, 0.5 * (0.35 + i * 0.65))],
        [0.18, rgba(b.hot, 0.34 * (0.3 + i * 0.7))],
        [0.55, rgba(b.mid, 0.1 * i)],
        [1, rgba(b.far, 0)],
      ])

      ctx.restore()
    }

    /** Light landing on the globe around the emitter, clipped to the sphere. */
    const drawSpill = (cy: number, apexY: number, intensity: number) => {
      ctx.save()
      const b = beam()
      ctx.globalCompositeOperation = b.op
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.clip()
      glowEllipse(cx, apexY, r * 0.62, r * 0.42, [
        [0, rgba(b.hot, 0.2 * b.gain * (0.3 + intensity * 0.7))],
        [0.45, rgba(b.mid, 0.07 * b.gain * (0.3 + intensity * 0.7))],
        [1, rgba(b.far, 0)],
      ])
      ctx.restore()
    }

    const drawMotes = (apexY: number, intensity: number, dt: number) => {
      if (intensity <= 0.02) return
      ctx.save()
      const b = beam()
      ctx.globalCompositeOperation = b.op
      for (const m of motes) {
        m.rise += m.speed * dt
        if (m.rise > 1) {
          m.rise = 0
          m.spread = (Math.random() * 2 - 1) * 44
        }
        // Drift outwards as they climb, following the light.
        const x = cx + m.spread * (1 + m.rise * 2.4)
        const y = apexY - m.rise * beamLen
        const fade = Math.sin(m.rise * Math.PI) * intensity
        if (fade <= 0.01) continue
        ctx.fillStyle = rgba(b.hot, fade * 0.42 * b.gain)
        ctx.beginPath()
        ctx.arc(x, y, m.size, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
    }

    /** Flattened rings around the apex — the emitter's platform. */
    const drawRings = (apexY: number, intensity: number, time: number) => {
      if (intensity <= 0.01) return
      ctx.save()
      const b = beam()
      ctx.globalCompositeOperation = b.op
      ctx.translate(cx, apexY)
      for (let i = 0; i < 4; i++) {
        const rx = 58 + i * 52
        const alpha = (0.19 - i * 0.035) * intensity
        if (alpha <= 0) continue
        ctx.strokeStyle = rgba(b.mid, alpha * b.gain)
        ctx.lineWidth = i === 1 ? 1.6 : 1
        ctx.setLineDash(i % 2 ? [3, 12] : [])
        ctx.lineDashOffset = (i % 2 ? -1 : 1) * time * 0.018
        ctx.beginPath()
        ctx.ellipse(0, 0, rx, rx * 0.24, 0, 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.setLineDash([])

      // One brighter arc sweeping around, like a scanning head.
      const sweep = (time * 0.0009) % (Math.PI * 2)
      ctx.strokeStyle = rgba(b.hot, 0.4 * intensity * b.gain)
      ctx.lineWidth = 1.8
      ctx.beginPath()
      ctx.ellipse(0, 0, 110, 110 * 0.24, 0, sweep, sweep + 0.85)
      ctx.stroke()
      ctx.restore()
    }

    /** Nodes riding the rim. The one nearest the apex drives everything else. */
    const drawNodes = (cy: number, gamma: number, time: number) => {
      for (let i = 0; i < N; i++) {
        // Minus, so that advancing gamma brings nodes to the top in order.
        const angle = TOP - i * STEP + gamma
        const nx = cx + Math.cos(angle) * r
        const ny = cy + Math.sin(angle) * r
        if (ny > vh + 40 || ny < -40) continue

        const near = 1 - Math.abs(shortest(angle - TOP)) / (STEP / 2)
        const heat = smoothstep(clamp01(near))
        const size = 2.5 + heat * 4

        ctx.save()
        const b = beam()
        ctx.globalCompositeOperation = b.op
        glowEllipse(nx, ny, 30 + heat * 46, 30 + heat * 46, [
          [0, rgba(b.mid, (0.26 + heat * 0.42) * b.gain)],
          [1, rgba(b.mid, 0)],
        ])
        ctx.fillStyle = rgba(b.core, 0.6 + heat * 0.4)
        ctx.beginPath()
        ctx.arc(nx, ny, size, 0, Math.PI * 2)
        ctx.fill()

        // A slow pulse keeps the rim alive between projects.
        const pulse = (time * 0.00035 + i / N) % 1
        ctx.strokeStyle = rgba(b.mid, (1 - pulse) * (0.1 + heat * 0.22) * b.gain)
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(nx, ny, size + pulse * 30, 0, Math.PI * 2)
        ctx.stroke()
        ctx.restore()
      }
    }

    /* ----- loop --------------------------------------------------- */

    let target = 0
    let progress = 0
    let cyValue = 0
    let primed = false
    let last = 0
    let shown = -1
    let visible = true

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      if (disposed || !vw) return
      const dt = last ? Math.min((now - last) / 1000, 1 / 20) : 1 / 60
      last = now

      const y = window.scrollY
      const alpha = 1 - 0.62 * smoothstep(clamp01((y - fadeStart) / Math.max(fadeEnd - fadeStart, 1)))

      if (y < riseFrom - 100) {
        if (visible) {
          layer.style.visibility = 'hidden'
          visible = false
        }
        panel.style.opacity = '0'
        contactGlobe.alpha = 0
        return
      }
      if (!visible) {
        layer.style.visibility = 'visible'
        visible = true
      }
      layer.style.opacity = alpha.toFixed(3)

      // Where the sphere's centre wants to be, on its climb up the page.
      const parked = vh * apex + r
      let wanted: number
      if (y <= projStart) {
        const t = clamp01((y - riseFrom) / Math.max(projStart - riseFrom, 1))
        wanted = lerp(vh + r + 80, parked, easeInOut(t))
      } else if (y <= projEnd) {
        wanted = parked
      } else {
        const t = clamp01((y - projEnd) / Math.max(contactTop - projEnd, 1))
        wanted = lerp(parked, vh * CONTACT_NADIR - r, easeInOut(t))
      }

      target = clamp01((y - projStart) / Math.max(projEnd - projStart, 1))
      // First frame snaps, so arriving mid-section does not spin up from zero.
      const k = primed ? 1 - Math.exp(-dt / SCRUB) : 1
      primed = true
      progress += (target - progress) * k
      cyValue += (wanted - cyValue) * k
      const cy = cyValue
      const apexY = cy - r

      // Published so the contact form's rocket can launch off the surface.
      contactGlobe.cx = cx
      contactGlobe.cy = cy
      contactGlobe.r = r
      contactGlobe.alpha = alpha

      // Exactly one turn over the section, offset half a step at each end so it
      // opens and closes with the beam unfocused rather than mid-project. The
      // climb afterwards keeps rolling, so the globe never freezes.
      const climb = clamp01((y - projEnd) / Math.max(contactTop - projEnd, 1))
      const gamma = (progress * N - 0.5) * STEP + easeInOut(climb) * 0.8 * STEP

      // Which node is nearest the apex, and how squarely is it there.
      let best = 0
      let bestDelta = Infinity
      for (let i = 0; i < N; i++) {
        const delta = Math.abs(shortest(gamma - i * STEP))
        if (delta < bestDelta) {
          bestDelta = delta
          best = i
        }
      }
      const focus = 1 - bestDelta / (STEP / 2)
      // Holds wide open through most of a node's turn, then collapses fast, so
      // the content swap happens while the panel is invisible.
      const intensity = smoothstep(clamp01((focus - 0.08) / 0.34)) * (1 - climb)

      if (shown !== best) {
        shown = best
        setActive(best)
        // Titles differ in length, so the panel's height changes with the
        // project — re-fit once React has painted the new content.
        requestAnimationFrame(() => requestAnimationFrame(fitPanel))
      }

      ctx.clearRect(0, 0, vw, vh)

      const lon = -28 - now * 0.0012
      projection.scale(r).translate([cx, cy]).rotate([lon, -8])
      ctx.save()
      // Rolling about the axis pointing at the viewer is a plain screen-space
      // rotation about the globe's centre.
      ctx.translate(cx, cy)
      ctx.rotate(gamma)
      ctx.translate(-cx, -cy)
      drawWireframe(ctx, {
        data,
        path,
        cx,
        cy,
        r,
        lon,
        lat: -8,
        s: 1 + (r / 248 - 1) * 0.5,
        backAlpha: 0.5,
        landAlpha: 0.5,
        vw,
        vh,
        // The canvas is rotated, so cull against the whole disc instead of the
        // viewport — a dot off screen now may be on screen once rotated.
        cull: { minX: cx - r - 2, minY: cy - r - 2, maxX: cx + r + 2, maxY: cy + r + 2 },
      })
      ctx.restore()

      drawSpill(cy, apexY, intensity)
      drawRings(apexY, intensity, now)
      drawLight(apexY, intensity, now)
      drawMotes(apexY, intensity, dt)
      drawNodes(cy, gamma, now)

      // The panel resolves with the light: it lifts, sharpens and brightens.
      panel.style.opacity = `${intensity}`
      panel.style.pointerEvents = intensity > 0.65 ? 'auto' : 'none'
      panel.style.transform = `translate(-50%, -100%) perspective(1100px) rotateX(${(1 - intensity) * 12}deg) translateY(${(1 - intensity) * 26}px) scale(${0.94 + intensity * 0.06})`
      panel.style.filter = `blur(${(1 - intensity) * 7}px)`
    }

    measure()
    // Screenshots decode after first paint and change the panel's height.
    panel.querySelectorAll('img').forEach((img) => img.addEventListener('load', fitPanel))
    raf = requestAnimationFrame(frame)

    loadGlobeData().then(
      (loaded) => {
        if (!disposed) data = loaded
      },
      (err) => console.warn('[ProjectHologram]', err),
    )

    const onResize = () => measure()
    window.addEventListener('resize', onResize)
    // Section offsets shift as the page settles, so track the document box.
    const observer = new ResizeObserver(onResize)
    observer.observe(document.body)

    return () => {
      disposed = true
      observer.disconnect()
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
    }
  }, [reduce])

  const project = projects[active]

  if (reduce) {
    return (
      <section id="projects" className="relative z-10 py-24 px-6 md:px-20 max-w-6xl mx-auto">
        <div className="font-mono text-xs text-accent uppercase tracking-widest mb-3.5">Selected work</div>
        <h2 className="font-display font-semibold text-3xl md:text-4xl mb-11">Things I've built</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-5">
          {projects.map((p) => (
            <div key={p.title} className="bg-card border border-line rounded-2xl p-6">
              <div className="font-display font-semibold text-lg">{p.title}</div>
              <p className="text-sm text-muted mt-2 leading-relaxed">{p.description}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                {p.stack.map((slug) => (
                  <span key={slug} className="font-mono text-[11px] text-accent">
                    {skillBySlug[slug]?.name ?? slug}
                  </span>
                ))}
              </div>
              {p.github && (
                <a
                  href={p.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hoverable mt-4 inline-flex items-center gap-2 text-sm text-fg/80 hover:text-accent"
                >
                  <GitHubIcon className="h-4 w-4" /> Repository
                </a>
              )}
            </div>
          ))}
        </div>
      </section>
    )
  }

  return (
    <>
      {/* The globe lives on its own fixed layer so it can carry on past the end
          of the projects section and up over the contact form. */}
      <div ref={layerRef} aria-hidden className="fixed inset-0 z-0 pointer-events-none">
        <canvas ref={canvasRef} className="absolute inset-0" />
      </div>

      <section ref={sectionRef} id="projects" className="relative z-10" style={{ height: `${(N + 1) * 100}svh` }}>
        <div className="sticky top-0 h-svh overflow-hidden pointer-events-none">
          {/* The whole HUD sits top-left: the globe fills the bottom of the
              screen edge to edge on narrow viewports, and the floating menu
              owns the top-right corner. */}
          <div data-hud className="absolute top-8 left-6 md:left-14 z-10">
            <div className="font-mono text-[11px] text-accent uppercase tracking-[0.22em]">Selected work</div>
            <h2 className="font-display font-semibold text-lg lg:text-3xl mt-1 lg:mt-2">Things I've built</h2>

            <div className="flex items-center gap-3 mt-2 lg:mt-5">
              <span className="font-mono text-[11px] text-accent tracking-[0.2em]">
                {String(active + 1).padStart(2, '0')} / {String(N).padStart(2, '0')}
              </span>
              <div className="flex gap-1.5">
                {projects.map((p, i) => (
                  <span
                    key={p.title}
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      i === active ? 'w-6 bg-accent' : 'w-1.5 bg-fg/25'
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-dim mt-2.5 hidden lg:block [@media(max-height:760px)]:lg:hidden">
              Scroll to rotate the array
            </div>
          </div>

          {/* The projected panel. Position and opacity are driven by the loop. */}
          <div
            ref={panelRef}
            className="absolute z-10 w-[min(92vw,clamp(28rem,64vw,88rem))] origin-bottom will-change-transform"
            style={{ opacity: 0 }}
          >
            <HoloPanel index={active} project={project} />
          </div>
        </div>
      </section>
    </>
  )
}

/**
 * One project.
 *
 * The frame holds the screenshot and nothing else — laying the text over it
 * covered the very thing it is there to show. The slug, title, blurb and stack
 * float around the frame on the page instead, so the image is never obscured
 * and can take all the height that is going.
 */
function HoloPanel({ index, project }: { index: number; project: Project }) {
  const shot = projectImage(project.image)

  return (
    <div data-wrap className="flex flex-col gap-3">
      {/* !p-0 so the screenshot reaches the frame's edges — a plain p-0 would
          lose to the base padding depending on stylesheet order. */}
      <div data-frame className="shrink-0">
      <HoloFrame panelClassName="!p-0 overflow-hidden">
        <div className="relative">
          {shot ? (
            <img
              data-shot
              src={shot}
              alt={project.title}
              loading="lazy"
              decoding="async"
              className="block w-full"
            />
          ) : (
            <div className="grid h-40 w-full place-items-center font-mono text-[10px] uppercase tracking-[0.18em] text-dim">
              No screenshot yet
            </div>
          )}
          {/* Scanlines, over the image rather than behind it. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                'repeating-linear-gradient(180deg, rgb(var(--accent) / 0.14) 0px, rgb(var(--accent) / 0.14) 1px, transparent 1px, transparent 4px)',
            }}
          />
        </div>
      </HoloFrame>
      </div>

      <div data-meta className="min-w-0">
      <div className="flex items-center justify-between gap-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent dark:text-cyan-200/80">
          Project {String(index + 1).padStart(2, '0')}
        </span>
        {project.github && (
          <a
            href={project.github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${project.title} on GitHub`}
            title="View on GitHub"
            // The stage is pointer-events-none so it never blocks scrolling; the
            // link opts back in, and the loop gates it on legibility.
            className="hoverable pointer-events-auto rounded-full border border-accent/30 bg-ink/60 p-1.5 text-fg/80 backdrop-blur-sm transition-colors hover:border-accent hover:text-accent dark:border-cyan-300/25"
          >
            <GitHubIcon className="h-4 w-4" />
          </a>
        )}
      </div>

        <h3
          className="font-display font-semibold text-[0.98rem] sm:text-[1.12rem] leading-snug text-fg"
          style={{ textShadow: '0 2px 14px rgb(var(--ink))' }}
        >
          {project.title}
        </h3>
        <p className="mt-1 text-[12px] sm:text-[13px] leading-relaxed text-muted">{project.description}</p>
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {project.stack.map((slug) => {
            const skill = skillBySlug[slug]
            if (!skill) return null
            return (
              <span
                key={slug}
                title={skill.name}
                className="flex items-center gap-1.5 rounded-[3px] border border-accent/30 bg-ink/50 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-fg/85 backdrop-blur-sm dark:border-cyan-300/25"
              >
                <img
                  src={skill.logo}
                  alt=""
                  className={`h-3 w-3 object-contain ${skill.invert ? 'dark:invert' : ''}`}
                />
                {skill.name}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}
