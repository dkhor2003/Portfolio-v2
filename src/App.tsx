import { useEffect, useRef, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Nav from './components/Nav';
import CustomCursor from './components/CustomCursor';
import Backdrop from './components/Backdrop';
import FloatingMenu from './components/FloatingMenu';
import LatteLoader from './components/LatteLoader';
import { ScrollProgress } from './components/motion/Reveal';
import { loadGlobeData } from './lib/globe-data';
import Home from './pages/Home';
import LatteArt from './pages/LatteArt';
import NotFound from './pages/NotFound';

/** How long the curtain stays up, at minimum. Boot waits for the globe too. */
const BOOT_MS = 1500;
const ROUTE_MS = 850;
const FADE_MS = 520;

/**
 * Drives the loading curtain: on boot it waits for the globe's land data (and
 * the webfonts) so the page is never revealed half-drawn, and on every route
 * change it plays a shorter version so navigation gets the same beat.
 */
function useRouteCurtain() {
  const { pathname } = useLocation();
  const bootRef = useRef(true);
  const [stage, setStage] = useState<'up' | 'fading' | 'gone'>('up');

  useEffect(() => {
    // Only cleared once a curtain has actually finished. Clearing it here would
    // make StrictMode's throwaway first run consume the boot, and the real run
    // would skip waiting for the globe.
    const boot = bootRef.current;
    setStage('up');

    // The curtain implies a fresh start; restoring a half-scrolled page behind
    // it would drop the visitor into the middle of the globe's journey.
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);

    let cancelled = false;
    const waits: Promise<unknown>[] = [new Promise((r) => setTimeout(r, boot ? BOOT_MS : ROUTE_MS))];
    if (boot) {
      waits.push(loadGlobeData().catch(() => undefined));
      if (document.fonts) waits.push(document.fonts.ready);
    }

    let fadeTimer: number | undefined;
    Promise.all(waits).then(() => {
      if (cancelled) return;
      bootRef.current = false;
      setStage('fading');
      fadeTimer = window.setTimeout(() => !cancelled && setStage('gone'), FADE_MS);
    });

    return () => {
      cancelled = true;
      window.clearTimeout(fadeTimer);
    };
  }, [pathname]);

  // Nothing behind the curtain should scroll out from under it.
  useEffect(() => {
    if (stage === 'gone') return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [stage]);

  return stage;
}

export default function App() {
  const stage = useRouteCurtain();

  return (
    <div className="bg-ink text-white font-body min-h-screen relative overflow-x-hidden">
      {stage !== 'gone' && <LatteLoader fading={stage === 'fading'} />}
      <Backdrop />
      <CustomCursor />
      <ScrollProgress />
      <FloatingMenu />
      <div className="relative z-10">
        <Nav />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/latte-art" element={<LatteArt />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </div>
  );
}
