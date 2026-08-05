import { useState } from 'react';
import { Link } from 'react-router-dom';
import GlobeScene from '@/components/GlobeScene';
import JourneySection from '@/components/JourneyCard';
import SkillCarousel from '@/components/SkillCarousel';
import { Reveal, Rise, RevealGroup, RevealItem, MaskLine } from '../components/motion/Reveal';
import { experience, projects } from '../data/content';
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

        {/* The composition: oversized condensed type with a serif italic accent. */}
        <h1 className="relative z-10 px-6 md:px-14 font-poster uppercase leading-[0.84] tracking-[-0.015em] text-[clamp(3.2rem,13.5vw,12.5rem)] pointer-events-none select-none">
          <MaskLine delay={0.15}>
            <span>Software</span>{' '}
            {/* <span className="font-editorial italic lowercase tracking-[-0.01em] text-[0.82em] pr-[0.06em]">
              full&#8209;stack
            </span> */}
          </MaskLine>
          <MaskLine delay={0.28}>Developer</MaskLine>
        </h1>

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
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              Available for work
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

      <section
        id="about"
        className="relative z-10 min-h-svh flex items-center px-6 md:px-20 py-28"
      >
        <div className="relative grid md:grid-cols-[1.2fr_1fr] gap-14 max-w-6xl mx-auto w-full">
          <Reveal>
            <div className="font-mono text-xs text-accent uppercase tracking-widest mb-3.5">About</div>
            <h2 className="font-display font-semibold text-3xl md:text-4xl leading-tight">I like building things that feel alive.</h2>
            <p className="mt-5 text-[15.5px] leading-relaxed text-[#b0b0bc] max-w-lg">
              Placeholder bio — swap in your own story. I'm a software developer who enjoys the intersection of engineering
              and motion: interfaces with real physics, transitions that feel inevitable, and code that stays fast under
              pressure. When I'm not shipping features, I'm steaming milk and chasing symmetric rosettas.
            </p>
          </Reveal>
          <RevealGroup className="grid grid-cols-2 gap-4 content-start">
            {[['5+', 'Years building software'], ['30+', 'Shipped projects'], ['IA', 'Based in, open to remote'], ['☕', 'Certified latte artist*']].map(([n, l]) => (
              <RevealItem key={l} className="bg-card border border-line rounded-xl p-5 transition-colors hover:border-accent/40">
                <div className="font-display font-bold text-2xl text-accent">{n}</div>
                <div className="text-xs text-muted mt-1">{l}</div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      <section id="experience" className="relative z-10 py-24 px-6 md:px-20 max-w-3xl mx-auto">
        <Reveal>
          <div className="font-mono text-xs text-accent uppercase tracking-widest mb-3.5">Experience</div>
          <h2 className="font-display font-semibold text-3xl md:text-4xl mb-12">Where I've worked</h2>
        </Reveal>
        <RevealGroup stagger={0.12} className="relative pl-7 border-l border-white/10 flex flex-col gap-11">
          {experience.map((job) => (
            <RevealItem key={job.role} className="relative">
              <div className="absolute -left-[33px] top-1 w-2.5 h-2.5 rounded-full bg-accent shadow-[0_0_0_4px_#0a0a0f,0_0_12px_#4dd9d0]" />
              <div className="font-mono text-xs text-dim mb-1.5">{job.dates}</div>
              <div className="font-display font-semibold text-lg">{job.role} · <span className="text-muted font-medium">{job.company}</span></div>
              <p className="text-sm text-[#a4a4b0] mt-2 leading-relaxed max-w-xl">{job.description}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

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

      <section id="projects" className="relative z-10 py-24 px-6 md:px-20 max-w-6xl mx-auto">
        <Reveal>
          <div className="font-mono text-xs text-accent uppercase tracking-widest mb-3.5">Selected work</div>
          <h2 className="font-display font-semibold text-3xl md:text-4xl mb-11">Things I've built</h2>
        </Reveal>
        <RevealGroup stagger={0.1} className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6">
          {projects.map((p) => (
            <RevealItem
              key={p.name}
              className="cursor-view group bg-card border border-line rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:border-white/20"
            >
              <div className="h-40 bg-[#181820] flex items-center justify-center text-dim font-mono text-[11px] overflow-hidden">
                <span className="transition-transform duration-500 group-hover:scale-110">[ project screenshot ]</span>
              </div>
              <div className="p-5.5">
                <div className="font-display font-semibold text-[17px]">{p.name}</div>
                <p className="text-sm text-[#a4a4b0] mt-2 leading-relaxed">{p.description}</p>
                <div className="flex flex-wrap gap-1.5 mt-3.5">
                  {p.tags.map((t) => <span key={t} className="text-[11px] font-mono text-accent bg-accent/10 px-2.5 py-1 rounded-full">{t}</span>)}
                </div>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      <section id="contact" className="relative z-10 pt-28 pb-16 px-6 md:px-20 max-w-xl mx-auto text-center">
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
        <span className="font-mono">built with d3 &amp; too much coffee</span>
      </footer>
    </>
  );
}
