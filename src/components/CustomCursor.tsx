import { useEffect, useRef, useState } from 'react';

/** Milliseconds between each character in the `>_` ⇄ `>GO` sequence. */
const STEP = 110;

/**
 * Terminal-style pointer.
 *
 * Idle it reads `>_` with a blinking underscore. Over anything interactive the
 * underscore drops out, then `G` types in, then `O`. Leaving reverses it:
 * `O` clears, then `G`, then the underscore returns and resumes blinking.
 */
export default function CustomCursor() {
  const rootRef = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: -200, y: -200 });
  const pos = useRef({ x: -200, y: -200 });
  const raf = useRef(0);

  const [visible, setVisible] = useState(false);
  const [hovering, setHovering] = useState(false);
  // Which glyphs of "GO" are currently on screen: 0, 1 (G) or 2 (GO).
  const [letters, setLetters] = useState(0);
  const [underscore, setUnderscore] = useState(true);

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    setVisible(true);

    const onMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };

    const onOver = (e: Event) => {
      const el = e.target as HTMLElement | null;
      if (!el || typeof el.closest !== 'function') return;
      setHovering(Boolean(el.closest('.hoverable, .cursor-view, a, button')));
    };

    const onDocLeave = () => setVisible(false);
    const onDocEnter = () => setVisible(true);

    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseover', onOver, true);
    document.addEventListener('mouseleave', onDocLeave);
    document.addEventListener('mouseenter', onDocEnter);

    const tick = () => {
      pos.current.x += (mouse.current.x - pos.current.x) * 0.45;
      pos.current.y += (mouse.current.y - pos.current.y) * 0.45;
      if (rootRef.current) {
        rootRef.current.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0) translateY(-50%)`;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver, true);
      document.removeEventListener('mouseleave', onDocLeave);
      document.removeEventListener('mouseenter', onDocEnter);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  // Drive the character sequence. Skipped on mount so the idle state (`>_`)
  // does not play the exit animation before anything has been hovered.
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }

    const timers: number[] = [];
    const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));

    if (hovering) {
      setUnderscore(false);
      at(STEP, () => setLetters(1));
      at(STEP * 2, () => setLetters(2));
    } else {
      setLetters(1); // O clears first
      at(STEP, () => setLetters(0)); // then G
      at(STEP * 2, () => setUnderscore(true)); // then the underscore returns
    }

    return () => timers.forEach(clearTimeout);
  }, [hovering]);

  if (!visible) return null;

  // Three fixed 1ch cells, so glyphs appearing and clearing never shift the layout.
  const cell = 'inline-block w-[1ch] text-center transition-opacity duration-150';

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[9999]">
      <div ref={rootRef} className="absolute top-0 left-0">
        <span className="flex font-mono text-[17px] font-bold leading-none tracking-[0.06em] text-accent select-none">
          <span className={cell}>&gt;</span>

          {/* Slot one holds the underscore and the G, stacked so they can hand
              over without either reflowing the other. */}
          <span className={`${cell} relative`}>
            <span className={`absolute inset-0 ${underscore ? 'animate-blink' : 'opacity-0'}`}>_</span>
            <span className={`absolute inset-0 transition-opacity duration-150 ${letters >= 1 ? 'opacity-100' : 'opacity-0'}`}>
              G
            </span>
          </span>

          <span className={`${cell} ${letters >= 2 ? 'opacity-100' : 'opacity-0'}`}>O</span>
        </span>
      </div>
    </div>
  );
}
