import { useEffect, useRef } from 'react';

const COLUMNS = [20, 40, 60, 80];

/**
 * Page backdrop: full-bleed column rules plus a fine grain overlay.
 * The rule nearest the pointer brightens, which ties the background to the
 * custom cursor without adding anything that competes with the content.
 */
export default function Backdrop() {
  const rulesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const container = rulesRef.current;
    if (!container) return;
    const rules = Array.from(container.children) as HTMLElement[];

    let frame = 0;
    let pointerX = -9999;

    const paint = () => {
      frame = 0;
      const width = window.innerWidth;
      rules.forEach((rule, i) => {
        const ruleX = (COLUMNS[i] / 100) * width;
        // Falls off over ~220px, so only the nearest rule or two light up.
        const proximity = Math.max(0, 1 - Math.abs(pointerX - ruleX) / 220);
        rule.style.opacity = String(0.045 + proximity * 0.28);
      });
    };

    const onMove = (e: MouseEvent) => {
      pointerX = e.clientX;
      if (!frame) frame = requestAnimationFrame(paint);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div aria-hidden className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <div ref={rulesRef} className="absolute inset-0">
        {COLUMNS.map((left) => (
          <div
            key={left}
            className="absolute top-0 bottom-0 w-px bg-fg transition-opacity duration-500"
            style={{ left: `${left}%`, opacity: 0.045 }}
          />
        ))}
      </div>

      {/* Fine grain, generated inline so there is no image request. Desaturated
          and applied with plain opacity — blend modes wash out on a near-black
          base, which is what this page is. */}
      <div
        className="absolute inset-0 opacity-[0.055]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}
