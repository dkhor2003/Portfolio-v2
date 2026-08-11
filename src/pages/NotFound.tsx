import { Link, useLocation } from 'react-router-dom';
import IdleGlobe from '../components/IdleGlobe';
import { Rise } from '../components/motion/Reveal';

/** Anything that isn't a real route lands here. */
export default function NotFound() {
  const { pathname } = useLocation();

  return (
    <section className="relative min-h-[calc(100svh-57px)] flex items-center justify-center overflow-hidden px-6">
      {/* The globe sits behind the copy and stays draggable — everything on top
          is pointer-events-none apart from the link. */}
      <IdleGlobe className="absolute inset-0" />

      {/* Darkens the middle of the wireframe just enough to read type over. */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_58%_46%_at_50%_50%,rgb(var(--ink)/0.92)_0%,rgb(var(--ink)/0.6)_55%,rgb(var(--ink)/0)_100%)]"
      />

      <div className="relative z-10 pointer-events-none text-center max-w-xl">
        <Rise delay={0.05} y={0} className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent">
          Signal lost
        </Rise>

        <Rise delay={0.12}>
          <h1 className="font-poster uppercase leading-[0.85] tracking-[-0.015em] text-[clamp(5rem,20vw,13rem)] mt-4">
            404
          </h1>
        </Rise>

        <Rise delay={0.24}>
          <p className="font-display font-semibold text-2xl md:text-[2rem] leading-tight mt-2">
            Coordinates Undetectable
          </p>
        </Rise>

        <Rise delay={0.34}>
          <p className="text-[15px] text-muted mt-4 leading-relaxed">
            Nothing charted at{' '}
            <span className="font-mono text-[13px] text-muted break-all">{pathname}</span>.
          </p>
        </Rise>

        <Rise delay={0.44}>
          <Link
            to="/"
            className="hoverable pointer-events-auto inline-block mt-8 font-mono text-[11px] uppercase tracking-[0.16em] border border-fg/25 rounded-full px-5 py-2.5 hover:border-accent hover:text-accent transition-colors"
          >
            ← back to known territory
          </Link>
        </Rise>

      </div>
    </section>
  );
}
