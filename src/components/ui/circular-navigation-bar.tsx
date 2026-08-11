import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';

export interface NavItem {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Route to navigate to. Ignored when `onSelect` is provided. */
  href?: string;
  /** In-page action (e.g. scroll to a section) instead of a route change. */
  onSelect?: () => void;
}

interface CircularNavigationProps {
  navItems: NavItem[];
  isOpen: boolean;
  toggleMenu: () => void;
}

/** Ring geometry at the reference size; scaled down proportionally on small screens. */
const BASE_SIZE = 420;
const BASE_RADIUS = 150;

export default function CircularNavigation({
  navItems,
  isOpen,
  toggleMenu,
}: CircularNavigationProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [size, setSize] = useState(BASE_SIZE);

  // The ring is laid out with pixel transforms, so the radius has to be
  // measured rather than expressed in CSS.
  useEffect(() => {
    const update = () =>
      setSize(Math.min(BASE_SIZE, window.innerWidth - 64, window.innerHeight - 120));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Close on Escape, and stop the page behind the overlay from scrolling.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') toggleMenu();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, toggleMenu]);

  const radius = (size / BASE_SIZE) * BASE_RADIUS;
  const itemSize = size < 340 ? 60 : 76;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="circular-nav"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          // Below the custom cursor (z-9999) so the pointer stays on top.
          className="fixed inset-0 z-[9000] flex items-center justify-center bg-ink/85 backdrop-blur-sm"
          onClick={toggleMenu}
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="relative aspect-square rounded-full flex items-center justify-center"
            style={{
              width: size,
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow:
                'inset 2px 2px 2px rgba(255,255,255,0.18), inset -1px -1px 1px rgba(255,255,255,0.12)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={toggleMenu}
              aria-label="Close menu"
              className="absolute aspect-square flex items-center justify-center w-12 h-12 rounded-full bg-fg text-ink z-10 transition-transform hover:scale-110"
            >
              <X className="w-6 h-6" />
            </button>

            {navItems.map((item, index) => {
              const Icon = item.icon;
              const angle = (360 / navItems.length) * index - 90;
              const active = hoveredItem === item.name;

              const inner = (
                <>
                  <Icon className="w-5 h-5 mb-1" />
                  <span className="text-[11px] font-medium tracking-tight">{item.name}</span>
                </>
              );

              const className = `flex flex-col items-center justify-center aspect-square rounded-full no-underline transition-colors duration-200 ${
                active ? 'bg-fg text-ink' : 'text-fg'
              }`;
              const style = { width: itemSize, height: itemSize };
              const handlers = {
                onMouseEnter: () => setHoveredItem(item.name),
                onMouseLeave: () => setHoveredItem(null),
              };

              return (
                // Ring placement lives on the outer node; motion owns `transform`
                // on the inner node for the scale-in, so the two must not share one.
                <div
                  key={item.name}
                  className="absolute"
                  style={{
                    transform: `rotate(${angle}deg) translate(${radius}px) rotate(${-angle}deg)`,
                  }}
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.4 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.18 + index * 0.05, duration: 0.35, ease: 'easeOut' }}
                  >
                  {item.onSelect ? (
                    <button
                      type="button"
                      className={className}
                      style={style}
                      {...handlers}
                      onClick={() => {
                        item.onSelect?.();
                        toggleMenu();
                      }}
                    >
                      {inner}
                    </button>
                  ) : (
                    <Link
                      to={item.href ?? '/'}
                      className={className}
                      style={style}
                      {...handlers}
                      onClick={toggleMenu}
                    >
                      {inner}
                    </Link>
                  )}
                  </motion.div>
                </div>
              );
            })}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
