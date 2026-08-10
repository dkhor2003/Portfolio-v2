import { motion, useReducedMotion } from 'motion/react';
import ImageDropSlot from './ImageDropSlot';
import { STACKED_QUERY, useMediaQuery } from '@/hooks/use-media-query';
import type { JourneyStop } from '../data/journey';

const SPRING = { type: 'spring', stiffness: 68, damping: 13, mass: 0.9 } as const;

/** Inner elements pop in one after another once the card lands. */
const item = {
  out: { opacity: 0, y: 14 },
  in: { opacity: 1, y: 0 },
};

function CardFace({ stop, index }: { stop: JourneyStop; index: number }) {
  return (
    <div className="hoverable relative rounded-[1.6rem] border border-line bg-card/75 backdrop-blur-md p-4 shadow-[0_36px_70px_-24px_rgba(0,0,0,0.95)]">
      {/* Strips of tape, because it is a photo pinned to a board. */}
      <span
        aria-hidden
        className="absolute -top-3.5 left-10 h-7 w-24 -rotate-[7deg] rounded-[3px] border border-white/10 bg-white/[0.07] backdrop-blur-sm"
      />
      <span
        aria-hidden
        className="absolute -top-2.5 right-8 h-6 w-16 rotate-[9deg] rounded-[3px] border border-white/10 bg-white/[0.05] backdrop-blur-sm"
      />

      <motion.div variants={item}>
        {/* Shorter frame when stacked: the card has to clear the globe's pin
            label below it, and a 4:3 photo makes it too tall to. */}
        <ImageDropSlot
          id={`journey-${stop.id}`}
          placeholder="Drop a photo"
          className="aspect-[16/10] lg:aspect-[4/3] w-full"
        />
      </motion.div>

      <motion.div variants={item} className="mt-4 flex items-baseline justify-between gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">{stop.pin.label}</span>
        <span className="font-mono text-[10px] tracking-[0.2em] text-dim">{stop.year}</span>
      </motion.div>

      <motion.p variants={item} className="mt-2.5 text-[15px] leading-relaxed text-[#d7d7e0]">
        {stop.text}
      </motion.p>

      <motion.div variants={item} className="mt-4 flex items-center gap-2 font-mono text-[10px] text-dim">
        <span className="text-accent">{String(index + 1).padStart(2, '0')}</span>
        <span className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent" />
        <span>
          {Math.abs(stop.pin.lat).toFixed(1)}°{stop.pin.lat >= 0 ? 'N' : 'S'} /{' '}
          {Math.abs(stop.pin.lng).toFixed(1)}°{stop.pin.lng >= 0 ? 'E' : 'W'}
        </span>
      </motion.div>
    </div>
  );
}

/**
 * One stop's card. It flies in from whichever side it rests on and — because
 * the viewport hook is not `once` — flies back out the same way once the stop
 * scrolls past, so reversing the scroll reverses the whole move.
 */
export function JourneyCard({ stop, index }: { stop: JourneyStop; index: number }) {
  const reduce = useReducedMotion();
  const stackedLayout = useMediaQuery(STACKED_QUERY);
  const dir = stop.from === 'left' ? -1 : 1;

  if (reduce) {
    return (
      <div className="w-[min(86vw,25rem)]">
        <CardFace stop={stop} index={index} />
      </div>
    );
  }

  // Stacked, the globe owns the bottom of the screen, so there is no side for a
  // card to come from — it drops from above and lifts back out the same way.
  const out = stackedLayout
    ? { x: 0, y: -190, rotate: dir * 5, scale: 0.9, opacity: 0 }
    : { x: dir * 190, y: 44, rotate: dir * 9, scale: 0.9, opacity: 0 };

  return (
    <motion.article
      className="w-[min(86vw,25rem)]"
      initial="out"
      whileInView="in"
      viewport={{ once: false, amount: 0.45 }}
      variants={{
        out,
        in: {
          x: 0,
          y: 0,
          rotate: 0,
          scale: 1,
          opacity: 1,
          transition: { ...SPRING, staggerChildren: 0.07, delayChildren: 0.08 },
        },
      }}
      transition={SPRING}
    >
      {/* The idle bob lives on its own element so the CSS animation never
          fights the transforms motion drives above and below it. */}
      <div className="animate-floaty" style={{ animationDelay: `${index * 0.9}s` }}>
        <motion.div style={{ rotate: dir * -1.6 }} whileHover={{ rotate: 0, y: -10, scale: 1.025 }} transition={SPRING}>
          <CardFace stop={stop} index={index} />
        </motion.div>
      </div>
    </motion.article>
  );
}

/**
 * Full-height stage for one stop: the globe parks, the card flies in.
 *
 * Wide, the card takes the side the globe is not on. Stacked, the globe drops
 * to the bottom of the screen and the card sits above it, centred.
 */
export default function JourneySection({ stop, index }: { stop: JourneyStop; index: number }) {
  return (
    <section
      id={stop.id}
      className="relative z-10 min-h-svh flex items-start lg:items-center justify-center lg:justify-normal px-6 lg:px-12 pt-24 lg:pt-0"
    >
      <div className="w-full max-w-[86rem] mx-auto flex justify-center lg:justify-normal">
        {/* Whole class names, not assembled ones — Tailwind scans source text
            and never sees a class built at runtime. */}
        <div className={stop.from === 'left' ? 'lg:mr-auto' : 'lg:ml-auto'}>
          <JourneyCard stop={stop} index={index} />
        </div>
      </div>
    </section>
  );
}
