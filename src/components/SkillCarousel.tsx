import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { categoryColor, skills, type Skill } from '../data/skills'
import { useTheme } from '@/lib/theme'

/** Idle marquee speed, in pixels per second. Both rows share it. */
const SPEED = 42
const BUBBLE_W = 258
/** Logos across the row, by row width. Tiles are sized to fit exactly this many. */
const perView = (width: number) => (width >= 1024 ? 7 : width >= 640 ? 5 : 3)

/* ----- scroll coupling ------------------------------------------------- */

/** Page scroll speed, in px/s, that counts as one full push. */
const SCROLL_REF = 750
/** How hard a full push multiplies the idle speed. Above 1 it can reverse. */
const SCROLL_GAIN = 10
/** Speed multiplier limits. Negative = running backwards. */
const FACTOR_MIN = -2.2
const FACTOR_MAX = 2.8
/** Smoothing time constant for scroll velocity, in seconds. */
const VEL_TAU = 0.14

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v)

interface Bubble {
  skill: Skill
  row: number
  /** Where the tail points, relative to the wrapper. */
  tipX: number
  /** Bubble centre, clamped to stay inside the wrapper. */
  x: number
  /** Tile edge the bubble grows from, relative to the wrapper. */
  y: number
}

/**
 * Two logo marquees running in opposite directions. Hovering a logo freezes
 * only the row it belongs to and pops a chat bubble with the skill's details.
 *
 * The bubble is rendered by the wrapper rather than by the tile: the rows clip
 * horizontally to hide the marquee seam, which would also clip a bubble parked
 * inside them.
 */
export default function SkillCarousel() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const trackRefs = useRef<(HTMLDivElement | null)[]>([])
  const [bubble, setBubble] = useState<Bubble | null>(null)
  const [width, setWidth] = useState(0)
  const reduce = useReducedMotion()

  const rows = [skills.filter((_, i) => i % 2 === 0), skills.filter((_, i) => i % 2 === 1)]

  // Tiles are sized off the row so a whole number of them spans it, which also
  // guarantees one copy is wider than the screen — no two of the same logo can
  // be on screen at once.
  const slot = width ? width / perView(width) : 0

  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const measure = () => setWidth(el.clientWidth)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Read by the animation loop, which must not restart when these change.
  const live = useRef({ slot: 0, paused: -1, counts: [0, 0] })
  useEffect(() => {
    live.current = { slot, paused: bubble?.row ?? -1, counts: [rows[0].length, rows[1].length] }
  })

  /**
   * Drives both rows from one loop. Scroll direction feeds a shared speed
   * multiplier: at rest it settles to 1 (idle drift in each row's own
   * direction), scrolling down pushes it above 1, and scrolling up drives it
   * negative so both rows run backwards. The velocity is smoothed and decays to
   * zero on its own, so the rows always ease back to their idle drift.
   *
   * This is a JS loop rather than a CSS animation because a keyframe animation
   * cannot smoothly change speed, let alone reverse.
   */
  useEffect(() => {
    if (reduce) return
    const wrap = wrapRef.current
    if (!wrap) return

    let raf = 0
    let last = 0
    let lastY = window.scrollY
    let scrolled = 0
    let velocity = 0
    const offsets = [0, 0]

    const onScroll = () => {
      const y = window.scrollY
      scrolled += y - lastY
      lastY = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const dt = last ? clamp((now - last) / 1000, 1 / 240, 1 / 20) : 1 / 60
      last = now

      // Per-frame scroll distance → px/s, then smoothed. With no scroll events
      // the instantaneous value is 0, so this eases back to the idle speed.
      const instant = scrolled / dt
      scrolled = 0
      velocity += (instant - velocity) * (1 - Math.exp(-dt / VEL_TAU))

      const push = clamp(velocity / SCROLL_REF, -1.8, 1.8)
      const factor = clamp(1 + SCROLL_GAIN * push, FACTOR_MIN, FACTOR_MAX)

      const { slot, paused, counts } = live.current
      for (let i = 0; i < trackRefs.current.length; i++) {
        const track = trackRefs.current[i]
        const copy = slot * counts[i]
        if (!track || !copy) continue
        // A hovered row is frozen outright, scroll included.
        if (paused !== i) offsets[i] += (i === 0 ? -1 : 1) * SPEED * factor * dt
        // Keep the offset inside one copy so the loop point stays invisible.
        let x = offsets[i] % copy
        if (x > 0) x -= copy
        offsets[i] = x
        track.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`
      }
    }

    // No point animating — or tracking scroll velocity — off screen.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !raf) {
          last = 0
          lastY = window.scrollY
          scrolled = 0
          velocity = 0
          raf = requestAnimationFrame(frame)
        } else if (!entry.isIntersecting && raf) {
          cancelAnimationFrame(raf)
          raf = 0
        }
      },
      { rootMargin: '200px 0px' },
    )
    io.observe(wrap)

    return () => {
      io.disconnect()
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
    }
  }, [reduce])

  const open = useCallback((skill: Skill, row: number, tile: HTMLElement) => {
    const wrap = wrapRef.current
    if (!wrap) return
    const w = wrap.getBoundingClientRect()
    const t = tile.getBoundingClientRect()
    const tipX = t.left - w.left + t.width / 2
    const margin = BUBBLE_W / 2 + 12
    setBubble({
      skill,
      row,
      tipX,
      x: Math.max(margin, Math.min(w.width - margin, tipX)),
      y: (row === 0 ? t.top : t.bottom) - w.top,
    })
  }, [])

  const close = useCallback(() => setBubble(null), [])

  // Touch devices tap instead of hovering, so anything outside a tile dismisses.
  useEffect(() => {
    if (!bubble) return
    const onDown = (e: PointerEvent) => {
      if (!(e.target as Element | null)?.closest?.('[data-skill-tile]')) close()
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [bubble, close])

  if (reduce) {
    return (
      <div className="px-6 md:px-20 max-w-6xl mx-auto flex flex-wrap gap-3">
        {skills.map((skill) => (
          <StaticTile key={skill.slug} skill={skill} />
        ))}
      </div>
    )
  }

  return (
    // The vertical padding reserves room for a bubble to pop outside the rows
    // without colliding with the copy above or the section below.
    <div ref={wrapRef} className="relative py-36 md:py-40">
      <div className="flex flex-col gap-5 md:gap-7">
        {rows.map((items, row) => (
          <Row
            key={row}
            items={items}
            row={row}
            slot={slot}
            width={width}
            trackRef={(el) => (trackRefs.current[row] = el)}
            dimmed={bubble?.row === row ? bubble.skill.slug : null}
            onOpen={open}
            onClose={close}
          />
        ))}
      </div>

      <AnimatePresence>
        {bubble && (
          <SkillBubble key={`${bubble.skill.slug}-${bubble.row}`} bubble={bubble} />
        )}
      </AnimatePresence>
    </div>
  )
}

function Row({
  items,
  row,
  slot,
  width,
  trackRef,
  dimmed,
  onOpen,
  onClose,
}: {
  items: Skill[]
  row: number
  /** Width of one logo's share of the row, padding included. */
  slot: number
  width: number
  trackRef: (el: HTMLDivElement | null) => void
  dimmed: string | null
  onOpen: (skill: Skill, row: number, tile: HTMLElement) => void
  onClose: () => void
}) {
  const copyWidth = slot * items.length
  // A copy narrower than the row would leave a growing empty band before the
  // loop point, so repeat until the row is always covered.
  const copies = copyWidth > 0 ? Math.max(2, Math.ceil(width / copyWidth) + 1) : 2

  return (
    <div
      className="overflow-hidden"
      style={{
        // Logos fade out at both edges instead of being cut off.
        maskImage: 'linear-gradient(to right, transparent, #000 7%, #000 93%, transparent)',
        WebkitMaskImage: 'linear-gradient(to right, transparent, #000 7%, #000 93%, transparent)',
      }}
    >
      <div
        ref={trackRef}
        data-marquee-track={row}
        className="flex w-max"
        // The transform is written every frame by the loop in SkillCarousel.
        style={{ willChange: 'transform', visibility: slot ? 'visible' : 'hidden' }}
      >
        {Array.from({ length: copies }, (_, copy) =>
          items.map((skill) => (
            <Tile
              key={`${copy}-${skill.slug}`}
              skill={skill}
              slot={slot}
              clone={copy > 0}
              dim={dimmed !== null && dimmed !== skill.slug}
              active={dimmed === skill.slug}
              onOpen={(tile) => onOpen(skill, row, tile)}
              onClose={onClose}
            />
          )),
        )}
      </div>
    </div>
  )
}

function Tile({
  skill,
  slot,
  clone,
  dim,
  active,
  onOpen,
  onClose,
}: {
  skill: Skill
  /** Width of one logo's share of the row, padding included. */
  slot: number
  clone: boolean
  dim: boolean
  active: boolean
  onOpen: (tile: HTMLElement) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLButtonElement>(null)
  // Subscribed rather than read from the cached palette: this is render-time, so
  // it has to re-run when the theme flips.
  const { theme } = useTheme()
  // One interaction path per device. A tap otherwise fires focus *and* a
  // compatibility mouseenter *and* a click, which open the bubble and then
  // immediately toggle it back shut.
  const canHover = useMemo(() => window.matchMedia('(hover: hover)').matches, [])

  const interaction = canHover
    ? {
        onMouseEnter: () => ref.current && onOpen(ref.current),
        onMouseLeave: onClose,
        onFocus: () => ref.current && onOpen(ref.current),
        onBlur: onClose,
      }
    : { onClick: () => (active ? onClose() : ref.current && onOpen(ref.current)) }

  const color = categoryColor[skill.category]
  // Filters are composed by hand: the `invert` utility would be overwritten by
  // an inline filter, and black-drawn logos need both. The invert is dark-only —
  // a black logo flipped to white would vanish against the light theme's paper.
  const filter = [
    skill.invert && theme === 'dark' ? 'invert(1)' : '',
    active ? `drop-shadow(0 0 16px ${color}80)` : 'grayscale(0.4)',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    // Padding rather than a flex gap, so every item advances the track by
    // exactly one slot — the loop only lines up if the pitch is uniform.
    <div
      className="shrink-0"
      style={{ width: slot, paddingLeft: slot * 0.055, paddingRight: slot * 0.055 }}
    >
      <button
        ref={ref}
        type="button"
        // The second copy exists only to make the loop seamless.
        aria-hidden={clone || undefined}
        tabIndex={clone ? -1 : 0}
        aria-label={`${skill.name} — ${skill.category}, proficiency ${skill.level} of 100`}
        data-skill-tile
        {...interaction}
        className={`hoverable grid aspect-square w-full place-items-center rounded-3xl border bg-card/70 backdrop-blur-sm transition-all duration-300 ${
          dim ? 'opacity-50' : 'opacity-100'
        } ${active ? '-translate-y-2 scale-[1.04]' : ''}`}
        style={
          // The glow picks up the skill's own category colour, matching the
          // card it opens.
          active
            ? { borderColor: `${color}8c`, boxShadow: `0 0 46px -8px ${color}b3`, backgroundColor: `${color}0f` }
            : { borderColor: 'rgba(255,255,255,0.08)' }
        }
      >
        <img
          src={skill.logo}
          alt=""
          draggable={false}
          style={{ filter }}
          className={`h-[52%] w-[52%] object-contain transition-all duration-300 ${
            active ? 'scale-110' : 'opacity-90'
          }`}
        />
      </button>
    </div>
  )
}

function SkillBubble({ bubble }: { bubble: Bubble }) {
  const { skill, row, x, y, tipX } = bubble
  const color = categoryColor[skill.category]
  const above = row === 0
  const tail = Math.max(14, Math.min(BUBBLE_W - 14, tipX - x + BUBBLE_W / 2))

  return (
    <motion.div
      className="pointer-events-none absolute z-20"
      style={{
        left: x,
        top: above ? y - 14 : y + 14,
        width: BUBBLE_W,
        x: '-50%',
        y: above ? '-100%' : '0%',
      }}
      initial={{ opacity: 0, scale: 0.86 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.12 } }}
      transition={{ type: 'spring', stiffness: 420, damping: 26 }}
    >
      <div className="relative rounded-2xl border border-line bg-card/95 p-4 shadow-[0_24px_60px_-18px_rgb(var(--shadow)/0.5)] backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <span className="font-display text-[15px] font-semibold leading-none">{skill.name}</span>
          <span className="font-mono text-[15px] font-bold leading-none" style={{ color }}>
            {skill.level}
          </span>
        </div>

        <span
          className="mt-2.5 inline-block rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.16em]"
          style={{ color, borderColor: `${color}59`, backgroundColor: `${color}14` }}
        >
          {skill.category}
        </span>

        <div className="mt-3">
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-dim">Proficiency</div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-fg/10">
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${color}66, ${color})` }}
              initial={{ width: 0 }}
              animate={{ width: `${skill.level}%` }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.06 }}
            />
          </div>
        </div>

        {/* Chat-bubble tail: a rotated square showing two of its borders. */}
        <span
          className={`absolute h-3 w-3 rotate-45 border-line bg-card ${
            above ? '-bottom-[7px] border-b border-r' : '-top-[7px] border-l border-t'
          }`}
          style={{ left: tail - 6 }}
        />
      </div>
    </motion.div>
  )
}

/** Reduced-motion fallback: no marquee, everything visible at once. */
function StaticTile({ skill }: { skill: Skill }) {
  const color = categoryColor[skill.category]
  return (
    <div className="flex items-center gap-2.5 rounded-full border border-line bg-card/70 px-3.5 py-2">
      <img src={skill.logo} alt="" className="h-5 w-5 object-contain" />
      <span className="text-[13px]">{skill.name}</span>
      <span className="font-mono text-[11px]" style={{ color }}>
        {skill.level}
      </span>
    </div>
  )
}
