import { Link } from 'react-router-dom';
import InteractiveBentoGallery from '@/components/ui/interactive-bento-gallery';
import { latteArt } from '../data/latte';

// The loading curtain is global now — see useRouteCurtain in App.
export default function LatteArt() {
  return (
    <>
      <header className="pt-24 pb-12 px-6 md:px-20 max-w-3xl mx-auto text-center animate-fadeUp">
        <div className="font-mono text-xs text-latte uppercase tracking-widest mb-3.5">Side hustle</div>
        <h1 className="font-display font-semibold text-3xl md:text-5xl leading-tight">My Latte Art Gallery</h1>
        <p className="text-[15px] text-muted mt-4 max-w-lg mx-auto">
          A home barista who started learning to pour latte art since January 2026 through online tutorial videos. Any advice, suggestions, or criticisms are welcomed.
        </p>
        <Link to="/" className="hoverable inline-block mt-6 text-sm font-mono text-[#c2c2cc]">← back to portfolio</Link>
      </header>

      {/* The header above already names the page, so the gallery's own title and
          description are left off. */}
      <section className="pb-20 animate-fadeUp">
        <p className="text-center font-mono text-[11px] uppercase tracking-[0.2em] text-dim">
          Tap a pour to open it · drag to rearrange
        </p>
        <InteractiveBentoGallery mediaItems={latteArt} />
      </section>

      <footer className="px-6 md:px-20 py-10 flex justify-between items-center text-dim text-xs border-t border-line max-w-6xl mx-auto">
        <span>© 2026 Dylan Khor</span>
        <Link to="/" className="text-dim font-mono">← portfolio</Link>
      </footer>
    </>
  );
}
