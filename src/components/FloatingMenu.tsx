import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Home, User, Briefcase, Wrench, FolderOpen, Mail, Coffee } from 'lucide-react';
import CircularNavigation, { type NavItem } from './ui/circular-navigation-bar';

/** Scroll distance past which the sticky-less navbar is considered gone. */
const THRESHOLD = 90;

/**
 * Shows a floating MENU trigger once the top navbar has scrolled out of view,
 * opening the circular navigation overlay.
 */
export default function FloatingMenu() {
  const [past, setPast] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const locationRef = useRef(location.pathname);
  locationRef.current = location.pathname;

  useEffect(() => {
    const onScroll = () => setPast(window.scrollY > THRESHOLD);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const goToSection = (id: string) => {
    if (locationRef.current !== '/') {
      navigate('/');
      // Wait for the home route to mount before the anchor exists.
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 60);
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const navItems: NavItem[] = [
    { name: 'Home', icon: Home, onSelect: () => goToSection('hero') },
    { name: 'About', icon: User, onSelect: () => goToSection('about') },
    { name: 'Experience', icon: Briefcase, onSelect: () => goToSection('experience') },
    { name: 'Skills', icon: Wrench, onSelect: () => goToSection('skills') },
    { name: 'Work', icon: FolderOpen, onSelect: () => goToSection('projects') },
    { name: 'Contact', icon: Mail, onSelect: () => goToSection('contact') },
    { name: 'Latte Art', icon: Coffee, href: '/latte-art' },
  ];

  const toggleMenu = () => setIsOpen((v) => !v);

  return (
    <>
      <AnimatePresence>
        {past && !isOpen && (
          <motion.button
            key="menu-trigger"
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onClick={toggleMenu}
            aria-label="Open menu"
            className="hoverable fixed top-6 right-6 md:right-14 z-50 font-mono text-[11px] font-bold uppercase tracking-[0.16em] bg-ink/80 backdrop-blur-md border border-white/25 rounded-full px-5 py-3 hover:border-accent hover:text-accent transition-colors"
          >
            Menu
          </motion.button>
        )}
      </AnimatePresence>

      <CircularNavigation navItems={navItems} isOpen={isOpen} toggleMenu={toggleMenu} />
    </>
  );
}
