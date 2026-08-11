import { useLayoutEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import GlobeScene from '@/components/GlobeScene';
import JourneySection from '@/components/JourneyCard';
import SkillCarousel from '@/components/SkillCarousel';
import ProjectHologram from '@/components/ProjectHologram';
import GlitchHeadline from '@/components/GlitchHeadline';
import ContactLaunch from '@/components/ContactLaunch';
import { socialLinks } from '@/components/SocialIcons';
import { Reveal, Rise } from '../components/motion/Reveal';
import { journey } from '../data/journey';

/** Share of the viewport width the headline fills once it is stacked. */
const STACKED_FILL = 0.8
/** The headline's CSS size: clamp(3.2rem, 13.5vw, 12.5rem). */
const naturalFontSize = (vw: number) => Math.min(Math.max(3.2 * 16, 0.135 * vw), 12.5 * 16)
/**
 * Ceiling on the stacked headline so the globe below it still lands above the
 * fold. Two lines at 0.84 leading is 1.68x the font size, and the rest of the
 * column — nav, the section's padding, the gap and the globe's own box — has to
 * come out of the viewport first. On phones this never binds and the headline
 * gets its full 80%; on a wide viewport that stacked only because the type ran
 * into the globe, it trades a little width for keeping both on screen.
 */
const heightCappedFontSize = (vh: number) => (0.66 * vh - 200) / 1.68

/**
 * Decides whether the hero stacks, and how big the headline should be once it
 * does.
 *
 * Stacking is measured rather than pinned to a breakpoint: the type is sized in
 * vw and the globe is capped in px, so the crossover depends on the viewport's
 * shape, not just its width.
 *
 * The size is measured too, rather than being a hand-tuned vw number, because
 * how wide a line renders depends on the typeface — hard-coding a ratio would
 * quietly stop filling the screen the day the display font changes.
 */
function useHeroLayout() {
  const [layout, setLayout] = useState({ stacked: false, fontSize: 0 })

  useLayoutEffect(() => {
    const measure = () => {
      const frame = document.getElementById('hero-frame')
      const heading = frame?.querySelector('h1')
      if (!frame || !heading) return

      // Widest rendered line, via a range over the text — the line boxes
      // themselves are full-width blocks and would measure the container.
      let text = 0
      const walker = document.createTreeWalker(frame, NodeFilter.SHOW_TEXT)
      const range = document.createRange()
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        range.selectNodeContents(node)
        text = Math.max(text, range.getBoundingClientRect().width)
      }
      const applied = parseFloat(getComputedStyle(heading).fontSize)
      if (!text || !applied) return
      // Width per pixel of font size. Scale-invariant, so measuring it while a
      // size of our own is applied is safe.
      const perPx = text / applied

      const vw = window.innerWidth
      // Collision is judged against the CSS size, never the enlarged one:
      // otherwise widening the window could not un-stack, since the bigger type
      // keeps the test true forever.
      const natural = perPx * naturalFontSize(vw)
      // The slot is a square box but the globe only fills the middle 80% of it
      // (GlobeScene uses slot / 2.5 as the radius). The box is flush with the
      // frame's right edge, so the space the headline can actually use is the
      // frame minus the globe (0.8) and minus the slot's right padding (0.1).
      const slot = Math.min(620, vw * 0.46, window.innerHeight - 100)
      // Stack once less than 40px of air would be left between the two.
      const stacked = natural + 40 + slot * 0.9 > frame.clientWidth

      // Fill the screen when stacked — bounded by the padded frame across, and
      // by what leaves the globe room down the page.
      const fontSize = stacked
        ? Math.min(
            (STACKED_FILL * vw) / perPx,
            frame.clientWidth / perPx,
            heightCappedFontSize(window.innerHeight),
          )
        : 0

      setLayout((prev) =>
        prev.stacked === stacked && Math.abs(prev.fontSize - fontSize) < 0.5 ? prev : { stacked, fontSize },
      )
    }

    measure()
    // Fonts land after first paint and change the measured width.
    document.fonts?.ready.then(measure).catch(() => undefined)
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  return layout
}

export default function Home() {
  const { stacked, fontSize } = useHeroLayout()

  return (
    <>
      {/* Fixed layer behind the page: idles in the hero, then walks the journey
          stops below before rolling off screen. Every section is z-10 so it
          stays underneath. */}
      <GlobeScene />

      <section
        id="hero"
        className="relative z-10 min-h-[calc(100svh-57px)] flex flex-col justify-center py-20"
      >
        {/* Edge micro-text — top left */}
        <Rise
          delay={0.5}
          y={0}
          className="absolute top-8 left-6 md:left-14 z-20 font-mono text-[10px] md:text-[11px] uppercase tracking-[0.18em] leading-[1.7] text-muted pointer-events-none"
        >
          Dylan Khor
          <br />
          portfolio
        </Rise>

        {/* Edge micro-text — top right */}
        <Rise
          delay={0.6}
          y={0}
          className="absolute top-8 right-6 md:right-14 z-20 hidden md:block max-w-[260px] font-mono text-[11px] uppercase tracking-[0.1em] leading-[1.6] text-muted pointer-events-none"
        >
          <span className="text-fg font-semibold">What I can help you with</span>
          <br />
          Full-stack web apps. APIs and data pipelines. Interactive front-ends. Latte art on request.
        </Rise>

        {/* The composition: oversized condensed type beside the globe, capped and
            centred so the two read as one unit — left-flush type on a wide
            screen leaves a hole between them. Once the headline grows wide
            enough to reach the globe they stack instead, type over globe.
            GlobeScene reads #hero-globe-slot, so the globe simply goes wherever
            the layout puts that box. */}
        <div
          className={`relative z-10 w-full max-w-[1600px] mx-auto px-6 md:px-14 ${
            // The pin's label is drawn up to ~55px above the pin itself, which
            // can sit at the very top of the disc — so the globe needs real
            // clearance under the headline, not just a hairline gap.
            stacked ? 'flex flex-col gap-10' : ''
          }`}
        >
          <div id="hero-frame">
            {/* Stacked, the type centres and is sized to fill the screen; the
                inline size overrides the clamp only in that arrangement. */}
            <GlitchHeadline
              lines={['Software', 'Developer']}
              className={`font-poster uppercase leading-[0.84] tracking-[-0.015em] text-[clamp(3.2rem,13.5vw,12.5rem)] pointer-events-none select-none ${
                stacked ? 'text-center' : ''
              }`}
              style={fontSize ? { fontSize: `${fontSize}px` } : undefined}
            />
          </div>

          {stacked && <div id="hero-globe-slot" aria-hidden className="relative w-full h-[40svh] min-h-[220px]" />}
        </div>

        {/* Side-by-side placement: a square box pinned to the frame's right edge. */}
        {!stacked && (
          <div className="pointer-events-none absolute inset-0 z-0 flex items-center">
            <div className="w-full max-w-[1600px] mx-auto px-6 md:px-14 flex justify-end">
              <div
                id="hero-globe-slot"
                aria-hidden
                className="aspect-square w-[min(620px,46vw,calc(100vh-100px))]"
              />
            </div>
          </div>
        )}

        {/* Bottom rail */}
        <div className="absolute bottom-8 inset-x-0 px-6 md:px-14 z-20 flex items-end justify-between gap-6">
          <Rise delay={0.8} y={0} className="flex items-center gap-4">
            <button
              className="hoverable font-mono text-[11px] uppercase tracking-[0.16em] border border-fg/25 rounded-full px-5 py-2.5 hover:border-accent hover:text-accent transition-colors"
              onClick={() => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })}
            >
              See my work
            </button>
            <button
              className="hoverable font-mono text-[11px] uppercase tracking-[0.16em] text-muted hover:text-fg transition-colors"
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Get in touch ↗
            </button>
          </Rise>

          <Rise
            delay={0.9}
            y={0}
            className="hidden md:flex flex-col items-end gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-dim"
          >
            <span className="flex items-center gap-2 text-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
              Busy, but open to hear
            </span>
            <span>41.6°N / 93.6°W</span>
          </Rise>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 hidden md:flex flex-col items-center gap-2 text-dim text-[10px] font-mono uppercase tracking-[0.2em] pointer-events-none">
          <span>Scroll</span>
          <div className="w-px h-7 bg-gradient-to-b from-dim to-transparent animate-bounce2" />
        </div>
      </section>

      {/* The journey: one full-height stage per stop. The globe flies between
          them, the cards fly in and out. */}
      {journey.map((stop, i) => (
        <JourneySection key={stop.id} stop={stop} index={i} />
      ))}

      {/* Full-bleed: the marquees run edge to edge, the copy stays in the grid. */}
      <section id="skills" className="relative z-10 py-24 overflow-hidden">
        <div className="px-6 md:px-20 max-w-6xl mx-auto">
          <Reveal>
            <div className="font-mono text-xs text-accent uppercase tracking-widest mb-3.5">Skills</div>
            <h2 className="font-display font-semibold text-3xl md:text-4xl">Tools of the trade</h2>
            <p className="text-[15px] text-muted mt-4 max-w-md">Hover a logo to pause its row and see where I stand with it.</p>
          </Reveal>
        </div>
        <SkillCarousel />
      </section>

      {/* Half a globe at the bottom of the screen, rolling with the scroll and
          projecting each project in turn. */}
      <ProjectHologram />

      {/* The top half is left clear: the globe finishes its climb here, hanging
          underside-down over the heading. */}
      <section id="contact" className="relative z-10 pt-[46svh] pb-16 px-6 md:px-20 max-w-xl mx-auto text-center">
        {/* Heading, blurb and form all live in ContactLaunch: they leave
            together once a message has been sent. */}
        <ContactLaunch />

        <Link to="/latte-art" className="hoverable mt-14 flex items-center justify-between bg-card border border-line rounded-2xl px-6 py-5 hover:border-latte transition-colors">
          <span className="text-sm font-semibold">Also — I make latte art ☕</span>
          <span className="text-latte text-sm">View gallery ↗</span>
        </Link>
      </section>

      {/* Three columns rather than justify-between, so the icons sit dead centre
          regardless of how wide the text either side runs. */}
      <footer className="relative z-10 px-6 md:px-20 py-10 border-t border-line max-w-6xl mx-auto grid gap-7 text-center text-dim text-xs md:grid-cols-3 md:items-center">
        <span className="md:text-left">© 2026 Dylan Khor</span>

        <div className="flex justify-center gap-3">
          {socialLinks.map(({ name, href, Icon }) => (
            <a
              key={name}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={name}
              title={name}
              className="hoverable group w-[38px] h-[38px] rounded-full border border-fg/15 flex items-center justify-center text-muted transition-all duration-300 hover:border-accent hover:text-accent hover:-translate-y-1 hover:shadow-[0_0_22px_-6px_rgba(77,217,208,0.7)]"
            >
              <Icon className="w-[16px] h-[16px] transition-transform duration-300 group-hover:scale-110" />
            </a>
          ))}
        </div>

        <span className="font-mono md:text-right">BUILT WITH TOO MUCH COFFEE</span>
      </footer>
    </>
  );
}
