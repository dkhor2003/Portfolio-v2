import { useEffect, useRef } from 'react';

/** Dot + trailing ring that follows the pointer; ring expands on `.hoverable` elements. */
export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: -100, y: -100 });
  const ring = useRef({ x: -100, y: -100 });
  const raf = useRef(0);

  useEffect(() => {
    const isFine = window.matchMedia('(pointer: fine)').matches;
    if (!isFine) return;
    if (dotRef.current) dotRef.current.style.display = 'block';
    if (ringRef.current) ringRef.current.style.display = 'block';

    const onMove = (e: MouseEvent) => { mouse.current.x = e.clientX; mouse.current.y = e.clientY; };
    const onEnter = (e: Event) => {
      if ((e.target as HTMLElement).closest('.hoverable') && ringRef.current) {
        ringRef.current.style.width = '52px';
        ringRef.current.style.height = '52px';
        ringRef.current.style.opacity = '1';
      }
    };
    const onLeave = (e: Event) => {
      if ((e.target as HTMLElement).closest('.hoverable') && ringRef.current) {
        ringRef.current.style.width = '32px';
        ringRef.current.style.height = '32px';
        ringRef.current.style.opacity = '.6';
      }
    };
    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseover', onEnter, true);
    document.addEventListener('mouseout', onLeave, true);

    const tick = () => {
      if (dotRef.current) { dotRef.current.style.left = mouse.current.x + 'px'; dotRef.current.style.top = mouse.current.y + 'px'; }
      ring.current.x += (mouse.current.x - ring.current.x) * 0.18;
      ring.current.y += (mouse.current.y - ring.current.y) * 0.18;
      if (ringRef.current) { ringRef.current.style.left = ring.current.x + 'px'; ringRef.current.style.top = ring.current.y + 'px'; }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onEnter, true);
      document.removeEventListener('mouseout', onLeave, true);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="fixed w-2 h-2 rounded-full bg-accent pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2 hidden" />
      <div ref={ringRef} className="fixed w-8 h-8 rounded-full border border-accent pointer-events-none z-[9998] -translate-x-1/2 -translate-y-1/2 opacity-60 transition-[width,height,opacity] duration-200 hidden" />
    </>
  );
}
