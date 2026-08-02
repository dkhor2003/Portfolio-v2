import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ImageDropSlot from '../components/ImageDropSlot';

export default function LatteArt() {
  const [loading, setLoading] = useState(true);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const t1 = setTimeout(() => setOpacity(0), 1500);
    const t2 = setTimeout(() => setLoading(false), 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <>
      {loading && (
        <div
          className="fixed inset-0 z-[200] bg-ink flex flex-col items-center justify-center gap-6 transition-opacity duration-500"
          style={{ opacity }}
        >
          <div className="relative w-[70px] h-[86px]">
            {[14, 31, 48].map((left, i) => (
              <div key={left} className="absolute -top-6 w-[9px] h-5 rounded-full bg-[#c2c2cc] animate-steamRise" style={{ left, animationDelay: `${i * 0.4}s` }} />
            ))}
            <div className="absolute bottom-0 left-0 right-0 h-[70px] border-[3px] border-[#e8ddc9] border-t-0 rounded-b-[20px] overflow-hidden bg-[#141018]">
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-b from-latte to-[#a06a2e] animate-fillCup" />
            </div>
            <div className="absolute -right-4 top-4 w-5 h-6.5 border-[3px] border-[#e8ddc9] border-l-0 rounded-r-xl" />
          </div>
          <div className="font-mono text-xs text-dim uppercase tracking-widest">Pulling a shot…</div>
        </div>
      )}

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
