import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { sectionIds } from '../data/content';

export default function Nav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const goTo = (id: string) => {
    setOpen(false);
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 50);
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const labels: Record<string, string> = { skills: 'Skills', projects: 'Work', contact: 'Contact' };

  return (
    // Deliberately not sticky: it scrolls away and FloatingMenu takes over.
    <nav className="relative z-30 flex items-center justify-between px-6 md:px-14 py-4 bg-ink/70 backdrop-blur-md border-b border-line">
      <Link to="/" className="font-display font-bold text-base tracking-tight">
        dylan<span className="text-accent">.dev</span>
      </Link>
      <div className="hidden md:flex gap-7 text-[13px] font-medium text-[#c2c2cc]">
        {sectionIds.filter((id) => id !== 'hero').map((id) => (
          <button key={id} onClick={() => goTo(id)} className="hoverable hover:text-white transition-colors">
            {labels[id]}
          </button>
        ))}
        <Link to="/latte-art" className="hoverable text-latte hover:text-latte/80 flex items-center gap-1">Latte Art ↗</Link>
      </div>
      <button className="md:hidden flex flex-col gap-1.5 p-1.5" onClick={() => setOpen((v) => !v)} aria-label="Menu">
        <span className="w-5 h-0.5 bg-white" />
        <span className="w-5 h-0.5 bg-white" />
        <span className="w-5 h-0.5 bg-white" />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 md:hidden bg-[#0e0e15] border-b border-line flex flex-col px-6 py-5 gap-4 text-[15px] font-medium">
          {sectionIds.filter((id) => id !== 'hero').map((id) => (
            <button key={id} onClick={() => goTo(id)} className="text-left">{labels[id]}</button>
          ))}
          <Link to="/latte-art" className="text-latte" onClick={() => setOpen(false)}>Latte Art ↗</Link>
        </div>
      )}
    </nav>
  );
}
