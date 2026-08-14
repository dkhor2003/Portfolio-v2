import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, useReducedMotion } from 'motion/react'
import { X } from 'lucide-react'
import { journeyDetails } from '@/data/journey-details'
import type { JourneyStop } from '../data/journey'

/**
 * The expanded view of one stop. The card stays where it is and this covers the
 * page, so the globe keeps its scroll position for when the panel closes.
 *
 * Portalled to the body: the app's content sits inside a `z-10` wrapper, which
 * is its own stacking context — inside it no z-index can climb over the
 * floating menu, which would swallow clicks on the close button.
 */
export default function JourneyDetail({ stop, onClose }: { stop: JourneyStop; onClose: () => void }) {
  const reduce = useReducedMotion()
  const titleId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)
  const Content = journeyDetails[stop.id]

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)

    // The page must not scroll under the overlay — the globe reads the scroll
    // position and would fly to another stop behind it.
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // Send focus into the panel, and hand it back to the card on close.
    const opener = document.activeElement as HTMLElement | null
    closeRef.current?.focus()

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
      opener?.focus?.()
    }
  }, [onClose])

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[110] flex items-start justify-center overflow-y-auto overscroll-contain p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28 }}
    >
      <div className="fixed inset-0 bg-ink/[0.97] backdrop-blur-2xl" onClick={onClose} />

      <motion.div
        className="relative my-auto w-full max-w-3xl rounded-[1.6rem] border border-line bg-card/85 p-6 shadow-[0_40px_90px_-30px_rgb(var(--shadow)/0.7)] backdrop-blur-xl sm:p-9"
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 26, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 210, damping: 28 }}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="hoverable absolute right-4 top-4 rounded-full border border-fg/20 bg-ink/40 p-2.5 text-muted backdrop-blur-sm transition-colors hover:border-accent hover:text-accent focus-visible:border-accent focus-visible:text-accent focus-visible:outline-none"
        >
          <X className="h-4 w-4" />
        </button>

        <header className="pr-14">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-[0.2em]">
            <span className="text-accent">{stop.pin.label}</span>
            <span className="text-dim">{stop.year}</span>
          </div>
          <h2 id={titleId} className="mt-3 font-display text-[1.25rem] font-semibold leading-snug text-fg sm:text-[1.6rem]">
            {stop.text}
          </h2>
        </header>

        {/* Bare tags inside a detail entry come out styled, so an entry can be
            plain markup and still match the rest of the page. */}
        <div
          className="mt-7 space-y-5 text-[15px] leading-relaxed text-fg/85
            [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-4
            [&_h3]:font-display [&_h3]:text-[1.05rem] [&_h3]:font-semibold [&_h3]:text-fg
            [&_h4]:font-mono [&_h4]:text-[10px] [&_h4]:uppercase [&_h4]:tracking-[0.2em] [&_h4]:text-accent
            [&_img]:w-full [&_img]:rounded-2xl [&_img]:border [&_img]:border-line [&_img]:object-cover
            [&_li]:marker:text-accent [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5"
        >
          {Content ? <Content /> : <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-dim">Nothing here yet.</p>}
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  )
}
