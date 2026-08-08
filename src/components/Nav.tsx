import { useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { sectionIds } from '../data/content';
import resumeUrl from '../assets/Dylan_Resume.pdf';

/**
 * Nav item with a hover roll: the label lifts away while a coloured copy rises
 * into its place, and a rule wipes in underneath. The point is to make it
 * obvious these words are buttons — plain colour-change alone read as static.
 */
function RollLink({
  children,
  onClick,
  href,
  to,
  // Written out in full rather than derived: Tailwind scans source text, so a
  // class name assembled at runtime never makes it into the stylesheet.
  accentText = 'text-accent',
  accentBg = 'bg-accent',
}: {
  children: ReactNode;
  onClick?: () => void;
  /** External target, opened in a new tab. */
  href?: string;
  /** In-app route. */
  to?: string;
  accentText?: string;
  accentBg?: string;
}) {
  const inner = (
    <>
      <span className="relative block overflow-hidden">
        <span className="block transition-transform duration-300 ease-out group-hover:-translate-y-full">{children}</span>
        <span
          aria-hidden
          className={`absolute inset-0 block translate-y-full transition-transform duration-300 ease-out group-hover:translate-y-0 ${accentText}`}
        >
          {children}
        </span>
      </span>
      <span
        aria-hidden
        className={`absolute -bottom-1 left-0 h-[1.5px] w-full origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100 ${accentBg}`}
      />
    </>
  );

  const className = 'hoverable group relative inline-block';

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {inner}
      </a>
    );
  }
  if (to) {
    return (
      <Link to={to} className={className}>
        {inner}
      </Link>
    );
  }
  return (
    <button onClick={onClick} className={className}>
      {inner}
    </button>
  );
}

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
        {sectionIds
          .filter((id) => id !== 'hero')
          .map((id) => (
            <RollLink key={id} onClick={() => goTo(id)}>
              {labels[id]}
            </RollLink>
          ))}
        <RollLink href={resumeUrl}>Resume ↗</RollLink>
        <RollLink to="/latte-art" accentText="text-latte" accentBg="bg-latte">
          Latte Art ↗
        </RollLink>
      </div>
      <button className="md:hidden flex flex-col gap-1.5 p-1.5" onClick={() => setOpen((v) => !v)} aria-label="Menu">
        <span className="w-5 h-0.5 bg-white" />
        <span className="w-5 h-0.5 bg-white" />
        <span className="w-5 h-0.5 bg-white" />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 md:hidden bg-[#0e0e15] border-b border-line flex flex-col px-6 py-5 gap-4 text-[15px] font-medium">
          {sectionIds
            .filter((id) => id !== 'hero')
            .map((id) => (
              <button key={id} onClick={() => goTo(id)} className="text-left">
                {labels[id]}
              </button>
            ))}
          <a href={resumeUrl} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>
            Resume ↗
          </a>
          <Link to="/latte-art" className="text-latte" onClick={() => setOpen(false)}>
            Latte Art ↗
          </Link>
        </div>
      )}
    </nav>
  );
}
