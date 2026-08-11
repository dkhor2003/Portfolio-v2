import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { animate, AnimatePresence, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { randomPointOnGlobe } from '@/lib/globe-stage'
import HoloFrame from './HoloFrame'
import Rocket from './Rocket'

const MESSAGE = 'Thanks, I will touch base with you soon...'

/* Beat sheet, in seconds from submit. */
const T_LAUNCH = 0.15
const T_HOVER = 1.5
const T_SUCK = 1.7
const T_DRAINED = 2.95
const T_BEAM_OFF = 3.1
const T_EXIT = 4.4
const T_MESSAGE = 2.5
const T_OVERLAY_END = 5.5

interface Field {
  /** Viewport rect of the real input this bar stands in for. */
  x: number
  y: number
  w: number
  h: number
}

interface Flight {
  fields: Field[]
  /** Where the rocket holds station while the beam is on. */
  hx: number
  hy: number
  /** Centre of the form stack — the beam's far end. */
  fx: number
  fy: number
  path: string
  /** Fraction of the path, 0–1, at which the rocket reaches the hover point. */
  hold: number
}

interface Puff {
  id: number
  x: number
  y: number
  size: number
  drift: number
}

/**
 * Builds the flight curve and measures the fraction at which it reaches the
 * hover point, so the rocket stops exactly there rather than at a guess.
 */
function buildPath(lx: number, ly: number, hx: number, hy: number, vw: number) {
  // In: a long arc down from the globe, settling into the hover.
  const inSeg = `M ${lx} ${ly} C ${lx + (hx - lx) * 0.2} ${ly + 170}, ${hx - 210} ${hy - 130}, ${hx} ${hy}`
  // Out: away to the right, climbing as it accelerates.
  const outSeg = `C ${hx + 250} ${hy + 20}, ${hx + 470} ${hy - 140}, ${vw + 300} ${hy - 210}`
  const d = `${inSeg} ${outSeg}`

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  const measure = (spec: string) => {
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    p.setAttribute('d', spec)
    svg.appendChild(p)
    return p.getTotalLength()
  }
  const total = measure(d)
  return { path: d, hold: total > 0 ? measure(inSeg) / total : 0.5 }
}

/**
 * The contact block and its send-off.
 *
 * On submit a rocket lifts off the globe overhead, holds station above the
 * form and opens a tractor beam — a corkscrew of rings that drags the three
 * fields up into the hull — then breaks away to the right. The reply resolves
 * out of its exhaust and stays: the heading, the blurb and the form are gone
 * for the rest of the visit, and only a reload brings them back.
 *
 * The flight plays in a fixed overlay laid over the form's measured rect, so it
 * animates in viewport coordinates while the block underneath keeps its height
 * and the page never reflows mid-shot.
 */
export default function ContactLaunch() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [phase, setPhase] = useState<'idle' | 'flying' | 'sent'>('idle')
  const [flight, setFlight] = useState<Flight | null>(null)
  const [puffs, setPuffs] = useState<Puff[]>([])
  const [clearCopy, setClearCopy] = useState(false)
  const [showMessage, setShowMessage] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const reduce = useReducedMotion()

  /** Position along the flight path, 0–100. */
  const distance = useMotionValue(0)
  const offset = useTransform(distance, (v) => `${v}%`)

  const submit = useCallback(
    (event: FormEvent) => {
      event.preventDefault()
      const el = formRef.current
      if (reduce || !el) {
        setClearCopy(true)
        setShowMessage(true)
        setPhase('sent')
        return
      }

      const fields: Field[] = [...el.querySelectorAll<HTMLElement>('[data-field]')].map((node) => {
        const r = node.getBoundingClientRect()
        return { x: r.left, y: r.top, w: r.width, h: r.height }
      })
      if (!fields.length) {
        setClearCopy(true)
        setShowMessage(true)
        setPhase('sent')
        return
      }

      const last = fields[fields.length - 1]
      const fx = fields[0].x + fields[0].w / 2
      const fy = (fields[0].y + last.y + last.h) / 2
      // Stands off above and to one side, so the beam reads as a funnel rather
      // than a flat line straight down.
      const hx = Math.min(fx + 130, window.innerWidth - 90)
      const hy = Math.max(fy - 260, 90)
      const launch = randomPointOnGlobe(window.innerWidth, window.innerHeight)

      setFlight({ fields, hx, hy, fx, fy, ...buildPath(launch.x, launch.y, hx, hy, window.innerWidth) })
      setPhase('flying')
    },
    [reduce],
  )

  useEffect(() => {
    if (phase !== 'flying' || !flight) return
    const timers: number[] = []

    distance.set(0)
    // One keyframed animation, not several: concurrent animate() calls on the
    // same motion value fight for control — a delayed one seizes the value the
    // moment it is created and pins whatever is already running.
    const span = T_EXIT - T_LAUNCH
    const hold = flight.hold * 100
    const flightAnim = animate(distance, [0, hold, hold, 100], {
      duration: span,
      delay: T_LAUNCH,
      times: [0, (T_HOVER - T_LAUNCH) / span, (T_BEAM_OFF - T_LAUNCH) / span, 1],
      // Settle into the hover, hold dead still, then break away hard.
      ease: [[0.3, 0, 0.18, 1], 'linear', [0.62, 0, 0.85, 0.5]],
    })

    // Smoke placed off the path geometry: no ref to thread through, and no
    // getBoundingClientRect on every tick.
    const probe = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    probe.setAttribute('d', flight.path)
    const total = probe.getTotalLength()

    let id = 0
    let smoke = 0
    timers.push(
      window.setTimeout(() => {
        smoke = window.setInterval(() => {
          const at = probe.getPointAtLength((total * distance.get()) / 100)
          setPuffs((prev) => [
            ...prev.slice(-40),
            {
              id: id++,
              x: at.x,
              y: at.y,
              size: 22 + Math.random() * 34,
              drift: (Math.random() - 0.5) * 44,
            },
          ])
        }, 60)
      }, T_LAUNCH * 1000),
    )

    timers.push(window.setTimeout(() => window.clearInterval(smoke), T_EXIT * 1000))
    timers.push(window.setTimeout(() => setClearCopy(true), T_SUCK * 1000))
    timers.push(window.setTimeout(() => setShowMessage(true), T_MESSAGE * 1000))
    timers.push(window.setTimeout(() => setPhase('sent'), T_OVERLAY_END * 1000))

    return () => {
      flightAnim.stop()
      window.clearInterval(smoke)
      timers.forEach(window.clearTimeout)
    }
  }, [phase, flight, distance])

  return (
    <>
      <div className="relative">
        {/* Heading, blurb and form leave together. They stay in the layout at
            zero opacity so the section keeps its height and nothing below it
            jumps while the rocket is still on screen. */}
        <motion.div
          animate={{ opacity: clearCopy ? 0 : 1, y: clearCopy ? -14 : 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden={clearCopy}
          style={{
            pointerEvents: clearCopy ? 'none' : 'auto',
            // Once the shot is over, take it out of the accessibility tree and
            // off the selection — but leave the box, so nothing below reflows.
            visibility: phase === 'sent' ? 'hidden' : 'visible',
          }}
        >
          <div className="font-mono text-xs text-accent uppercase tracking-widest mb-3.5">Contact</div>
          <h2 className="font-display font-semibold text-3xl md:text-5xl leading-tight">
            Let's connect.
          </h2>
          <p className="text-[15px] text-muted mt-4">
            Open to talk about any job or project opportunities, or even about latte arts. Drop a line below.
          </p>

          <form
            ref={formRef}
            className="mt-9 flex flex-col gap-3 text-left"
            onSubmit={submit}
            // Hidden but still laid out while the overlay copy is being drained.
            style={{ visibility: phase === 'idle' ? 'visible' : 'hidden' }}
          >
            <input
              required
              data-field
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="bg-card border border-fg/10 rounded-lg px-4 py-3.5 text-sm outline-none focus:border-accent"
            />
            <input
              required
              data-field
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="bg-card border border-fg/10 rounded-lg px-4 py-3.5 text-sm outline-none focus:border-accent"
            />
            <textarea
              required
              data-field
              placeholder="Message"
              rows={4}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="bg-card border border-fg/10 rounded-lg px-4 py-3.5 text-sm outline-none focus:border-accent resize-y"
            />
            <button type="submit" className="hoverable bg-accent text-ink font-bold text-sm rounded-lg py-3.5 mt-1.5">
              Send message
            </button>
          </form>
        </motion.div>

        {/* The reply, standing in the space the form vacated. Anchored to the
            lower part of that space rather than its middle: the globe is on a
            fixed layer with its underside always at 42% of the viewport, so
            centring here would put the panel over the globe as soon as the page
            is scrolled any further. The holographic backing keeps it legible if
            it does drift up there. */}
        {showMessage && (
          <motion.div
            className="absolute inset-x-0 bottom-0 top-[38%] flex items-center justify-center px-2"
            initial={{ opacity: 0, scale: 0.94, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          >
            <HoloFrame
              className="w-full max-w-lg text-left"
              // Denser than the project panel: this one sits over the globe.
              panelClassName="bg-[rgb(var(--panel)/0.92)] dark:bg-[rgb(var(--panel)/0.88)] backdrop-blur-md"
            >
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-accent dark:text-cyan-200/70">
                <span className="h-1.5 w-1.5 rounded-full bg-accent dark:bg-cyan-300 shadow-[0_0_8px_rgb(var(--accent))]" />
                Message sent
              </div>

              <motion.p
                className="mt-3 font-display text-[clamp(1.05rem,2.6vw,1.6rem)] font-semibold leading-snug text-fg"
                style={{ textShadow: '0 0 20px rgb(var(--accent) / 0.45)' }}
                initial="out"
                animate="in"
                variants={{ in: { transition: { staggerChildren: 0.032, delayChildren: 0.15 } }, out: {} }}
              >
                {MESSAGE.split(' ').map((word, i) => (
                  <motion.span
                    key={`${word}-${i}`}
                    className="inline-block whitespace-pre"
                    variants={{
                      // Resolving out of the exhaust: blurred and oversized, settling.
                      out: { opacity: 0, filter: 'blur(14px)', y: 14, scale: 1.12 },
                      in: { opacity: 1, filter: 'blur(0px)', y: 0, scale: 1 },
                    }}
                    transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {word}{' '}
                  </motion.span>
                ))}
              </motion.p>
            </HoloFrame>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {phase === 'flying' && flight && (
          <motion.div
            key="launch"
            className="fixed inset-0 z-[90] pointer-events-none"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <Beam flight={flight} distance={distance} />
            <DrainedFields flight={flight} />

            {puffs.map((puff) => (
              <motion.span
                key={puff.id}
                className="absolute rounded-full bg-fg/20 blur-[10px]"
                initial={{ opacity: 0.5, scale: 0.4 }}
                animate={{ opacity: 0, scale: 2.5, x: puff.drift, y: -38 }}
                transition={{ duration: 1.6, ease: 'easeOut' }}
                style={{
                  left: puff.x - puff.size / 2,
                  top: puff.y - puff.size / 2,
                  width: puff.size,
                  height: puff.size,
                }}
              />
            ))}

            <motion.div
              className="absolute left-0 top-0 h-20 w-20"
              style={{
                offsetPath: `path("${flight.path}")`,
                offsetDistance: offset,
                offsetAnchor: '50% 50%',
                // Points the nose along the curve; the artwork faces right.
                offsetRotate: 'auto',
              }}
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, delay: T_LAUNCH, ease: [0.34, 1.5, 0.5, 1] }}
            >
              <Rocket />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

/** The three field bars spiralling up the beam and into the hull. */
function DrainedFields({ flight }: { flight: Flight }) {
  const { fields, hx, hy } = flight

  return (
    <>
      {fields.map((field, i) => {
        const cx = field.x + field.w / 2
        const cy = field.y + field.h / 2
        // A waypoint off the straight line, so each bar corkscrews in rather
        // than sliding along a rule.
        const midX = cx + (hx - cx) * 0.45 + (i % 2 ? 70 : -70)
        const midY = cy + (hy - cy) * 0.5 + 26

        return (
          <motion.span
            key={i}
            className="absolute rounded-lg border bg-card"
            style={{ left: field.x, top: field.y, width: field.w, height: field.h }}
            animate={{
              x: [0, midX - cx, hx - cx],
              y: [0, midY - cy, hy - cy],
              rotate: [0, i % 2 ? 120 : -120, i % 2 ? 400 : -400],
              scale: [1, 0.5, 0.02],
              opacity: [1, 1, 0],
              // Lit by the beam on the way up, or they read as black holes
              // against a black page.
              borderColor: ['rgba(255,255,255,0.1)', 'rgba(77,217,208,0.85)', 'rgba(77,217,208,1)'],
              boxShadow: [
                '0 0 0 rgba(77,217,208,0)',
                '0 0 26px rgba(77,217,208,0.55)',
                '0 0 40px rgba(77,217,208,0.9)',
              ],
            }}
            transition={{
              duration: T_DRAINED - T_SUCK,
              delay: T_SUCK + i * 0.16,
              // Slow to peel away, then whipped into the hull.
              ease: [0.55, 0, 0.9, 0.45],
              times: [0, 0.55, 1],
            }}
          />
        )
      })}
    </>
  )
}

/**
 * The tractor beam: a corkscrew of rings running from the hull down to the
 * form. Drawn on canvas because it wants additive blending and per-frame
 * motion — as DOM nodes it would be dozens of blurred elements a frame.
 */
function Beam({ flight, distance }: { flight: Flight; distance: ReturnType<typeof useMotionValue<number>> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let vw = 0
    let vh = 0
    const size = () => {
      vw = window.innerWidth
      vh = window.innerHeight
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(vw * dpr)
      canvas.height = Math.round(vh * dpr)
      canvas.style.width = `${vw}px`
      canvas.style.height = `${vh}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    size()

    const probe = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    probe.setAttribute('d', flight.path)
    const total = probe.getTotalLength()

    const start = performance.now()
    let raf = 0

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const t = (now - start) / 1000
      ctx.clearRect(0, 0, vw, vh)

      // Fades up as the rocket settles, holds through the drain, snaps off.
      const power =
        t < T_HOVER - 0.25
          ? 0
          : t < T_SUCK
            ? (t - (T_HOVER - 0.25)) / (T_SUCK - T_HOVER + 0.25)
            : t < T_BEAM_OFF - 0.2
              ? 1
              : Math.max(0, 1 - (t - (T_BEAM_OFF - 0.2)) / 0.28)
      if (power <= 0.01) return

      const at = probe.getPointAtLength((total * distance.get()) / 100)
      const dx = flight.fx - at.x
      const dy = flight.fy - at.y
      const len = Math.hypot(dx, dy) || 1
      const angle = Math.atan2(dy, dx)
      const ux = dx / len
      const uy = dy / len
      // Perpendicular, for the corkscrew offset.
      const px = -uy
      const py = ux

      ctx.save()
      ctx.globalCompositeOperation = 'lighter'

      // Core shaft.
      const shaft = ctx.createLinearGradient(at.x, at.y, flight.fx, flight.fy)
      shaft.addColorStop(0, `rgba(210, 252, 255, ${0.5 * power})`)
      shaft.addColorStop(0.5, `rgba(77, 217, 208, ${0.16 * power})`)
      shaft.addColorStop(1, `rgba(60, 170, 235, ${0.05 * power})`)
      ctx.strokeStyle = shaft
      ctx.lineWidth = 5
      ctx.beginPath()
      ctx.moveTo(at.x, at.y)
      ctx.lineTo(flight.fx, flight.fy)
      ctx.stroke()

      // Rings, travelling up the shaft towards the hull.
      const RINGS = 15
      const phase = (t * 0.85) % 1
      for (let i = 0; i < RINGS; i++) {
        // s: 0 at the hull, 1 at the form. Subtracting the phase pulls them in.
        let s = i / RINGS - phase
        s = ((s % 1) + 1) % 1
        const along = s * len
        // Funnel: tight at the hull, wide at the form.
        const radius = 5 + Math.pow(s, 0.85) * 92
        const swirl = Math.sin(s * Math.PI * 3.2 + t * 5) * radius * 0.22
        const x = at.x + ux * along + px * swirl
        const y = at.y + uy * along + py * swirl
        // Brightest in the middle of the run, fading at both ends.
        const a = power * Math.sin(s * Math.PI) * 0.85

        ctx.strokeStyle = `rgba(140, 244, 255, ${a * 0.9})`
        ctx.lineWidth = 1 + (1 - s) * 2.4
        ctx.beginPath()
        ctx.ellipse(x, y, radius * 0.26, radius, angle, 0, Math.PI * 2)
        ctx.stroke()

        // A second, dimmer ring just behind gives the coil depth.
        ctx.strokeStyle = `rgba(77, 217, 208, ${a * 0.45})`
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.ellipse(x - ux * 9, y - uy * 9, radius * 0.24, radius * 0.94, angle, 0, Math.PI * 2)
        ctx.stroke()
      }

      // Muzzle bloom where the beam leaves the hull.
      const bloom = ctx.createRadialGradient(at.x, at.y, 0, at.x, at.y, 60)
      bloom.addColorStop(0, `rgba(235, 255, 255, ${0.55 * power})`)
      bloom.addColorStop(0.4, `rgba(77, 217, 208, ${0.22 * power})`)
      bloom.addColorStop(1, 'rgba(60, 170, 235, 0)')
      ctx.fillStyle = bloom
      ctx.fillRect(at.x - 60, at.y - 60, 120, 120)

      // Pool of light on the form.
      const pool = ctx.createRadialGradient(flight.fx, flight.fy, 0, flight.fx, flight.fy, 150)
      pool.addColorStop(0, `rgba(150, 240, 255, ${0.2 * power})`)
      pool.addColorStop(1, 'rgba(77, 217, 208, 0)')
      ctx.fillStyle = pool
      ctx.fillRect(flight.fx - 150, flight.fy - 150, 300, 300)

      ctx.restore()
    }

    raf = requestAnimationFrame(frame)
    window.addEventListener('resize', size)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', size)
    }
  }, [flight, distance])

  return <canvas ref={canvasRef} className="absolute inset-0" />
}
