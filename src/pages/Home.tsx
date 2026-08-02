import { useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar3D from '../components/Avatar3D';
import { experience, skillGroups, projects } from '../data/content';

export default function Home() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  return (
    <>
      <Avatar3D />

      <section id="hero" className="min-h-screen flex flex-col justify-center px-6 md:px-20 relative">
        <div className="max-w-xl relative z-[2]">
          <div className="font-mono text-[13px] text-accent mb-4">$ whoami</div>
          <h1 className="font-display font-bold text-[38px] md:text-[64px] leading-[1.02] tracking-tight">Alex Rivera</h1>
          <p className="font-display font-medium text-lg md:text-2xl text-muted mt-3.5">
            Software developer building fast, interactive things for the web — and pouring rosettas on the side.
          </p>
          <div className="flex gap-3.5 mt-9 flex-wrap">
            <button
              className="hoverable bg-accent text-ink font-bold text-sm px-6.5 py-3.5 rounded-lg transition-transform hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(77,217,208,0.25)]"
              onClick={() => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })}
            >
              See my work
            </button>
            <button
              className="hoverable bg-transparent text-white border border-white/20 font-semibold text-sm px-6 py-3 rounded-lg hover:border-white/50 transition-colors"
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Get in touch
            </button>
          </div>
        </div>
        <div className="absolute bottom-9 left-6 md:left-20 flex flex-col items-center gap-2 text-dim text-[11px] font-mono">
          <span>scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-dim to-transparent animate-bounce2" />
        </div>
      </section>

      <section id="about" className="pt-32 pb-24 px-6 md:px-20 grid md:grid-cols-[1.2fr_1fr] gap-14 max-w-6xl mx-auto">
        <div>
          <div className="font-mono text-xs text-accent uppercase tracking-widest mb-3.5">About</div>
          <h2 className="font-display font-semibold text-3xl md:text-4xl leading-tight">I like building things that feel alive.</h2>
          <p className="mt-5 text-[15.5px] leading-relaxed text-[#b0b0bc] max-w-lg">
            Placeholder bio — swap in your own story. I'm a software developer who enjoys the intersection of engineering
            and motion: interfaces with real physics, transitions that feel inevitable, and code that stays fast under
            pressure. When I'm not shipping features, I'm steaming milk and chasing symmetric rosettas.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 content-start">
          {[['5+', 'Years building software'], ['30+', 'Shipped projects'], ['SF', 'Based in, open to remote'], ['☕', 'Certified latte artist*']].map(([n, l]) => (
            <div key={l} className="bg-card border border-line rounded-xl p-5">
              <div className="font-display font-bold text-2xl text-accent">{n}</div>
              <div className="text-xs text-muted mt-1">{l}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="experience" className="py-24 px-6 md:px-20 max-w-3xl mx-auto">
        <div className="font-mono text-xs text-accent uppercase tracking-widest mb-3.5">Experience</div>
        <h2 className="font-display font-semibold text-3xl md:text-4xl mb-12">Where I've worked</h2>
        <div className="relative pl-7 border-l border-white/10 flex flex-col gap-11">
          {experience.map((job) => (
            <div key={job.role} className="relative">
              <div className="absolute -left-[33px] top-1 w-2.5 h-2.5 rounded-full bg-accent shadow-[0_0_0_4px_#0a0a0f,0_0_12px_#4dd9d0]" />
              <div className="font-mono text-xs text-dim mb-1.5">{job.dates}</div>
              <div className="font-display font-semibold text-lg">{job.role} · <span className="text-muted font-medium">{job.company}</span></div>
              <p className="text-sm text-[#a4a4b0] mt-2 leading-relaxed max-w-xl">{job.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="skills" className="py-24 px-6 md:px-20 max-w-6xl mx-auto">
        <div className="font-mono text-xs text-accent uppercase tracking-widest mb-3.5">Skills</div>
        <h2 className="font-display font-semibold text-3xl md:text-4xl mb-11">Tools of the trade</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-5">
          {skillGroups.map((g) => (
            <div key={g.title} className="bg-card border border-line rounded-2xl p-6">
              <div className="font-display font-semibold text-[15px] mb-4">{g.title}</div>
              <div className="flex flex-wrap gap-2">
                {g.items.map((s) => (
                  <span key={s} className="hoverable font-mono text-xs px-3 py-1.5 rounded-full border border-white/10 text-[#c2c2cc] hover:border-accent hover:text-accent transition-colors">{s}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="projects" className="py-24 px-6 md:px-20 max-w-6xl mx-auto">
        <div className="font-mono text-xs text-accent uppercase tracking-widest mb-3.5">Selected work</div>
        <h2 className="font-display font-semibold text-3xl md:text-4xl mb-11">Things I've built</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6">
          {projects.map((p) => (
            <div key={p.name} className="hoverable bg-card border border-line rounded-2xl overflow-hidden transition-all hover:-translate-y-1 hover:border-white/20">
              <div className="h-40 bg-[#181820] flex items-center justify-center text-dim font-mono text-[11px]">[ project screenshot ]</div>
              <div className="p-5.5">
                <div className="font-display font-semibold text-[17px]">{p.name}</div>
                <p className="text-sm text-[#a4a4b0] mt-2 leading-relaxed">{p.description}</p>
                <div className="flex flex-wrap gap-1.5 mt-3.5">
                  {p.tags.map((t) => <span key={t} className="text-[11px] font-mono text-accent bg-accent/10 px-2.5 py-1 rounded-full">{t}</span>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="contact" className="pt-28 pb-16 px-6 md:px-20 max-w-xl mx-auto text-center">
        <div className="font-mono text-xs text-accent uppercase tracking-widest mb-3.5">Contact</div>
        <h2 className="font-display font-semibold text-3xl md:text-5xl leading-tight">Let's build something together.</h2>
        <p className="text-[15px] text-muted mt-4">Have a project, a role, or just want to talk 3D avatars and latte art? Drop a line.</p>

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

      <footer className="px-6 md:px-20 py-10 flex justify-between items-center text-dim text-xs border-t border-line max-w-6xl mx-auto">
        <span>© 2026 Alex Rivera</span>
        <span className="font-mono">built with three.js &amp; too much coffee</span>
      </footer>
    </>
  );
}
