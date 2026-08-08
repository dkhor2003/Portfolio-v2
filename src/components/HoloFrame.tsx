import type { ReactNode } from 'react'

/**
 * The holographic panel chrome: glass, scanlines, a redraw sweep and corner
 * brackets. Shared so the project projector and the contact reply are visibly
 * the same piece of hardware.
 *
 * `panelClassName` appends to the glass itself, for callers that need a more
 * opaque backing — over the globe the default translucency is not enough to
 * separate the type from the halftone behind it.
 */
export default function HoloFrame({
  children,
  className = '',
  panelClassName = '',
}: {
  children: ReactNode
  className?: string
  panelClassName?: string
}) {
  return (
    <div className={`relative ${className}`}>
      <div
        className={`relative overflow-hidden rounded-[4px] border border-cyan-300/30 bg-[rgba(8,30,46,0.38)] px-7 py-6 shadow-[0_0_70px_-14px_rgba(77,190,255,0.4),inset_0_0_50px_rgba(90,200,255,0.06)] backdrop-blur-[3px] ${panelClassName}`}
      >
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

        <div className="relative">{children}</div>
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
