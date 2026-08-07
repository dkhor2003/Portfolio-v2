import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { useReducedMotion } from 'motion/react'
import { loadGlobeData, type GlobeData } from '@/lib/globe-data'
import { drawWireframe } from '@/lib/globe-render'
import { projects } from '../data/content'

const N = projects.length
/** Radians between neighbouring project nodes on the rim. */
const STEP = (Math.PI * 2) / N
/** Scroll-follow time constant, in seconds. Higher = heavier, more inertia. */
const SCRUB = 0.11
/** Screen angle of the emitter: straight up from the globe's centre. */
const TOP = -Math.PI / 2

/** Where the globe's apex sits while it is projecting, as a fraction of vh. */
const PROJECTING_APEX = 0.62
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
      beamLen = vh * PROJECTING_APEX * 0.92

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
      panel.style.top = `${vh * PROJECTING_APEX - vh * 0.08}px`
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
      const i = intensity * breathe

      ctx.save()
      ctx.globalCompositeOperation = 'lighter'

      // Wide, very faint haze — this is what dissolves into the page.
      glowEllipse(cx, apexY - beamLen * 0.3, Math.min(vw * 0.42, 560), beamLen * 1.5, [
        [0, `rgba(70, 150, 235, ${0.09 * i})`],
        [0.5, `rgba(55, 120, 220, ${0.035 * i})`],
        [1, 'rgba(40, 90, 200, 0)'],
      ])

      // The column proper, tighter and cooler.
      glowEllipse(cx, apexY - beamLen * 0.42, Math.min(vw * 0.2, 260), beamLen * 1.15, [
        [0, `rgba(120, 210, 255, ${0.17 * i})`],
        [0.45, `rgba(85, 175, 250, ${0.07 * i})`],
        [1, 'rgba(60, 140, 240, 0)'],
      ])

      // Bright throat just above the emitter.
      glowEllipse(cx, apexY - beamLen * 0.14, Math.min(vw * 0.09, 120), beamLen * 0.42, [
        [0, `rgba(200, 245, 255, ${0.3 * i})`],
        [0.5, `rgba(130, 215, 255, ${0.11 * i})`],
        [1, 'rgba(90, 180, 255, 0)'],
      ])

      // The source itself.
      const core = 46 * breathe
      glowEllipse(cx, apexY, core * 2.6, core * 2.1, [
        [0, `rgba(255, 255, 255, ${0.5 * (0.35 + i * 0.65)})`],
        [0.18, `rgba(175, 240, 255, ${0.34 * (0.3 + i * 0.7)})`],
        [0.55, `rgba(90, 185, 255, ${0.1 * i})`],
        [1, 'rgba(60, 140, 240, 0)'],
      ])

      ctx.restore()
    }

    /** Light landing on the globe around the emitter, clipped to the sphere. */
    const drawSpill = (cy: number, apexY: number, intensity: number) => {
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.clip()
      glowEllipse(cx, apexY, r * 0.62, r * 0.42, [
        [0, `rgba(150, 225, 255, ${0.2 * (0.3 + intensity * 0.7)})`],
        [0.45, `rgba(90, 180, 250, ${0.07 * (0.3 + intensity * 0.7)})`],
        [1, 'rgba(60, 140, 235, 0)'],
      ])
      ctx.restore()
    }

    const drawMotes = (apexY: number, intensity: number, dt: number) => {
      if (intensity <= 0.02) return
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
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
        ctx.fillStyle = `rgba(205, 240, 255, ${fade * 0.42})`
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
      ctx.globalCompositeOperation = 'lighter'
      ctx.translate(cx, apexY)
      for (let i = 0; i < 4; i++) {
        const rx = 58 + i * 52
        const alpha = (0.19 - i * 0.035) * intensity
        if (alpha <= 0) continue
        ctx.strokeStyle = `rgba(110, 205, 255, ${alpha})`
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
      ctx.strokeStyle = `rgba(180, 240, 255, ${0.4 * intensity})`
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
        ctx.globalCompositeOperation = 'lighter'
        glowEllipse(nx, ny, 30 + heat * 46, 30 + heat * 46, [
          [0, `rgba(130, 235, 255, ${0.26 + heat * 0.42})`],
          [1, 'rgba(120, 220, 255, 0)'],
        ])
        ctx.fillStyle = `rgba(225, 253, 255, ${0.6 + heat * 0.4})`
        ctx.beginPath()
        ctx.arc(nx, ny, size, 0, Math.PI * 2)
        ctx.fill()

        // A slow pulse keeps the rim alive between projects.
        const pulse = (time * 0.00035 + i / N) % 1
        ctx.strokeStyle = `rgba(120, 225, 255, ${(1 - pulse) * (0.1 + heat * 0.22)})`
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
        return
      }
      if (!visible) {
        layer.style.visibility = 'visible'
        visible = true
      }
      layer.style.opacity = alpha.toFixed(3)

      // Where the sphere's centre wants to be, on its climb up the page.
      const parked = vh * PROJECTING_APEX + r
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
      panel.style.transform = `translate(-50%, -100%) perspective(1100px) rotateX(${(1 - intensity) * 12}deg) translateY(${(1 - intensity) * 26}px) scale(${0.94 + intensity * 0.06})`
      panel.style.filter = `blur(${(1 - intensity) * 7}px)`
    }

    measure()
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
            <div key={p.name} className="bg-card border border-line rounded-2xl p-6">
              <div className="font-display font-semibold text-lg">{p.name}</div>
              <p className="text-sm text-[#a4a4b0] mt-2 leading-relaxed">{p.description}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                {p.tags.map((t) => (
                  <span key={t} className="font-mono text-[11px] text-accent">{t}</span>
                ))}
              </div>
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
          <div className="absolute top-8 left-6 md:left-14 z-10">
            <div className="font-mono text-[11px] text-accent uppercase tracking-[0.22em]">Selected work</div>
            <h2 className="font-display font-semibold text-2xl md:text-3xl mt-2">Things I've built</h2>

            <div className="flex items-center gap-3 mt-5">
              <span className="font-mono text-[11px] text-accent tracking-[0.2em]">
                {String(active + 1).padStart(2, '0')} / {String(N).padStart(2, '0')}
              </span>
              <div className="flex gap-1.5">
                {projects.map((p, i) => (
                  <span
                    key={p.name}
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      i === active ? 'w-6 bg-accent' : 'w-1.5 bg-white/25'
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-dim mt-2.5">
              Scroll to rotate the array
            </div>
          </div>

          {/* The projected panel. Position and opacity are driven by the loop. */}
          <div
            ref={panelRef}
            className="absolute z-10 w-[min(88vw,30rem)] origin-bottom will-change-transform"
            style={{ opacity: 0 }}
          >
            <HoloPanel index={active} name={project.name} description={project.description} tags={project.tags} />
          </div>
        </div>
      </section>
    </>
  )
}

/** The holographic panel itself — glass, scanlines and corner brackets. */
function HoloPanel({
  index,
  name,
  description,
  tags,
}: {
  index: number
  name: string
  description: string
  tags: string[]
}) {
  return (
    <div className="relative">
      <div className="relative overflow-hidden rounded-[4px] border border-cyan-300/30 bg-[rgba(8,30,46,0.38)] px-7 py-6 shadow-[0_0_70px_-14px_rgba(77,190,255,0.4),inset_0_0_50px_rgba(90,200,255,0.06)] backdrop-blur-[3px]">
        {/* Scanlines. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.45]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(180deg, rgba(150,225,255,0.08) 0px, rgba(150,225,255,0.08) 1px, transparent 1px, transparent 4px)',
          }}
        />
        {/* A brighter band sweeping down, as if the image is being redrawn. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 h-24 animate-holoScan"
          style={{ background: 'linear-gradient(180deg, transparent, rgba(160,235,255,0.11), transparent)' }}
        />

        <div className="relative">
          <div className="flex items-center justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-200/70">
            <span>Project {String(index + 1).padStart(2, '0')}</span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#67e8f9]" />
              Signal locked
            </span>
          </div>

          <h3
            className="font-display font-semibold text-[1.6rem] leading-tight mt-3 text-white"
            style={{ textShadow: '0 0 20px rgba(110,215,255,0.5)' }}
          >
            {name}
          </h3>

          <p className="text-[14.5px] leading-relaxed text-cyan-50/75 mt-3">{description}</p>

          <div className="mt-5 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-[3px] border border-cyan-300/25 bg-cyan-300/[0.06] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-cyan-100/85"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Corner brackets, drawn outside the panel edge. */}
      {[
        'left-[-5px] top-[-5px] border-l-2 border-t-2',
        'right-[-5px] top-[-5px] border-r-2 border-t-2',
        'left-[-5px] bottom-[-5px] border-l-2 border-b-2',
        'right-[-5px] bottom-[-5px] border-r-2 border-b-2',
      ].map((pos) => (
        <span key={pos} aria-hidden className={`absolute h-4 w-4 border-cyan-300/60 ${pos}`} />
      ))}
    </div>
  )
}
