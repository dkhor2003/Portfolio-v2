import { useEffect, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { MaskLine } from './motion/Reveal'

/** Quiet stretch between bursts, in milliseconds. */
const GAP_MIN = 3200
const GAP_RANGE = 6000
/** How long a burst lasts. */
const BURST_MIN = 240
const BURST_RANGE = 320

/**
 * The hero headline, with a chromatic-split glitch that fires every few
 * seconds at random.
 *
 * The coloured copies are separate absolute layers over the headline rather
 * than children of it: each line is revealed inside an `overflow-hidden` mask,
 * which would clip the glitch's offsets back off. They only mount during a
 * burst, which is always well after the reveal has finished.
 */
export default function GlitchHeadline({
  lines,
  className = '',
}: {
  lines: string[]
  className?: string
}) {
  const [burst, setBurst] = useState(false)
  const reduce = useReducedMotion()

  useEffect(() => {
    if (reduce) return
    let toBurst = 0
    let toCalm = 0

    const schedule = () => {
      toBurst = window.setTimeout(() => {
        setBurst(true)
        toCalm = window.setTimeout(() => {
          setBurst(false)
          schedule()
        }, BURST_MIN + Math.random() * BURST_RANGE)
      }, GAP_MIN + Math.random() * GAP_RANGE)
    }
    schedule()

    return () => {
      clearTimeout(toBurst)
      clearTimeout(toCalm)
    }
  }, [reduce])

  return (
    <div className="relative">
      <h1 className={`${className} ${burst ? 'animate-glitchSkew' : ''}`}>
        {lines.map((line, i) => (
          <MaskLine key={line} delay={0.15 + i * 0.13}>
            {line}
          </MaskLine>
        ))}
      </h1>

      {burst && (
        <>
          <div
            aria-hidden
            className={`${className} absolute inset-0 animate-glitchA text-[#ff2d6f] mix-blend-screen`}
          >
            {lines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </div>
          <div
            aria-hidden
            className={`${className} absolute inset-0 animate-glitchB text-accent mix-blend-screen`}
          >
            {lines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
