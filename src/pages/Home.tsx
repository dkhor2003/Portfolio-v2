import { useState } from 'react';
import { Link } from 'react-router-dom';
import GlobeScene from '@/components/GlobeScene';
import JourneySection from '@/components/JourneyCard';
import SkillCarousel from '@/components/SkillCarousel';
import ProjectHologram from '@/components/ProjectHologram';
import { Reveal, Rise, MaskLine } from '../components/motion/Reveal';
import { journey } from '../data/journey';

export default function Home() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

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
          <span className="text-white font-semibold">What I can help you with</span>
          <br />
          Full-stack web apps. APIs and data pipelines. Interactive front-ends. Latte art on request.
        </Rise>

        {/* The composition: oversized condensed type with a serif italic accent.
            Capped and centred so the type and the globe stay one composition —
            left-flush type on a wide screen leaves a hole between the two.
            GlobeScene measures #hero-frame to park the globe at its right edge. */}
        <div className="relative z-10 w-full max-w-[1600px] mx-auto px-6 md:px-14">
          <div id="hero-frame">
            <h1 className="font-poster uppercase leading-[0.84] tracking-[-0.015em] text-[clamp(3.2rem,13.5vw,12.5rem)] pointer-events-none select-none">
              <MaskLine delay={0.15}>
                <span>Software</span>{' '}
                {/* <span className="font-editorial italic lowercase tracking-[-0.01em] text-[0.82em] pr-[0.06em]">
                  full&#8209;stack
                </span> */}
              </MaskLine>
              <MaskLine delay={0.28}>Developer</MaskLine>
            </h1>
          </div>
        </div>

        {/* Bottom rail */}
        <div className="absolute bottom-8 inset-x-0 px-6 md:px-14 z-20 flex items-end justify-between gap-6">
          <Rise delay={0.8} y={0} className="flex items-center gap-4">
            <button
              className="hoverable font-mono text-[11px] uppercase tracking-[0.16em] border border-white/25 rounded-full px-5 py-2.5 hover:border-accent hover:text-accent transition-colors"
              onClick={() => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })}
            >
              See my work
            </button>
            <button
              className="hoverable font-mono text-[11px] uppercase tracking-[0.16em] text-muted hover:text-white transition-colors"
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
        <Reveal>
          <div className="font-mono text-xs text-accent uppercase tracking-widest mb-3.5">Contact</div>
          <h2 className="font-display font-semibold text-3xl md:text-5xl leading-tight">Let's build something together.</h2>
          <p className="text-[15px] text-muted mt-4">Have a project, a role, or just want to talk full-stack and latte art? Drop a line.</p>
        </Reveal>

        {submitted ? (
          <div className="mt-9 p-7 bg-card border border-accent rounded-2xl text-sm">Thanks — I'll get back to you soon. ✦</div>
        ) : (
          <form
            className="mt-9 flex flex-col gap-3 text-left"
            onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}
          >
            <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="bg-card border border-white/10 rounded-lg px-4 py-3.5 text-sm outline-none focus:border-accent" />
            <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="bg-card border border-white/10 rounded-lg px-4 py-3.5 text-sm outline-none focus:border-accent" />
            <textarea required placeholder="Message" rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="bg-card border border-white/10 rounded-lg px-4 py-3.5 text-sm outline-none focus:border-accent resize-y" />
            <button type="submit" className="hoverable bg-accent text-ink font-bold text-sm rounded-lg py-3.5 mt-1.5">Send message</button>
          </form>
        )}

        <div className="flex justify-center gap-3.5 mt-8">
          {['@', 'GH', 'in'].map((l) => (
            <a key={l} href="#" className="hoverable w-[42px] h-[42px] rounded-full border border-white/15 flex items-center justify-center text-[#c2c2cc] text-[13px] font-mono">{l}</a>
          ))}
        </div>

        <Link to="/latte-art" className="hoverable mt-14 flex items-center justify-between bg-card border border-line rounded-2xl px-6 py-5 hover:border-latte transition-colors">
          <span className="text-sm font-semibold">Also — I make latte art ☕</span>
          <span className="text-latte text-sm">View gallery ↗</span>
        </Link>
      </section>

      <footer className="relative z-10 px-6 md:px-20 py-10 flex justify-between items-center text-dim text-xs border-t border-line max-w-6xl mx-auto">
        <span>© 2026 Dylan Khor</span>
        <span className="font-mono">BUILT WITH TOO MUCH COFFEE</span>
      </footer>
    </>
  );
}
