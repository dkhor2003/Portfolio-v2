import { Link } from 'react-router-dom';
import ImageDropSlot from '../components/ImageDropSlot';

// The loading curtain is global now — see useRouteCurtain in App.
export default function LatteArt() {
  return (
    <>
      <header className="pt-24 pb-12 px-6 md:px-20 max-w-3xl mx-auto text-center animate-fadeUp">
        <div className="font-mono text-xs text-latte uppercase tracking-widest mb-3.5">Side project</div>
        <h1 className="font-display font-semibold text-3xl md:text-5xl leading-tight">Milk, steamed to a point.</h1>
        <p className="text-[15px] text-muted mt-4 max-w-lg mx-auto">
          A running gallery of rosettas, tulips, and the occasional swan — poured between pull requests.
        </p>
        <Link to="/" className="hoverable inline-block mt-6 text-sm font-mono text-[#c2c2cc]">← back to portfolio</Link>
      </header>

      <section className="px-6 md:px-20 pb-28 max-w-6xl mx-auto grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-5 animate-fadeUp">
        <ImageDropSlot id="latte1" placeholder="Drop a latte art photo" className="col-span-2 aspect-video" />
        <ImageDropSlot id="latte2" placeholder="Drop a latte art photo" className="aspect-square" />
        <ImageDropSlot id="latte3" placeholder="Drop a latte art photo" className="aspect-square" />
        <ImageDropSlot id="latte4" placeholder="Drop a latte art photo" className="aspect-square" />
        <ImageDropSlot id="latte5" placeholder="Drop a latte art photo" className="aspect-square" />
        <ImageDropSlot id="latte6" placeholder="Drop a latte art photo" className="col-span-2 aspect-video" />
        <ImageDropSlot id="latte7" placeholder="Drop a latte art photo" className="aspect-square" />
      </section>

      <footer className="px-6 md:px-20 py-10 flex justify-between items-center text-dim text-xs border-t border-line max-w-6xl mx-auto">
        <span>© 2026 Alex Rivera</span>
        <Link to="/" className="text-dim font-mono">← portfolio</Link>
      </footer>
    </>
  );
}
