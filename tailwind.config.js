/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Portfolio palette (pre-existing — do not remap these to shadcn vars,
        // `card`, `muted` and `accent` are used throughout src/pages/Home.tsx).
        ink: '#0a0a0f',
        card: '#121218',
        line: 'rgba(255,255,255,0.08)',
        muted: '#9a9aa8',
        dim: '#5a5a68',
        accent: '#4dd9d0',
        latte: '#d99a4d',

        // shadcn/ui tokens, driven by the CSS variables in src/index.css.
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        'card-foreground': 'var(--card-foreground)',
        popover: 'var(--popover)',
        'popover-foreground': 'var(--popover-foreground)',
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        'muted-foreground': 'var(--muted-foreground)',
        'accent-foreground': 'var(--accent-foreground)',
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        // Editorial hero pairing: condensed heavy grotesque + serif italic accent.
        poster: ['Anton', '"Arial Narrow"', 'sans-serif'],
        editorial: ['"Instrument Serif"', 'Georgia', 'serif'],
      },
      keyframes: {
        fillCup: { from: { height: '0%' }, to: { height: '72%' } },
        steamRise: {
          '0%': { transform: 'translateY(0) scaleX(1)', opacity: '0.5' },
          '50%': { transform: 'translateY(-16px) scaleX(1.3)', opacity: '0.15' },
          '100%': { transform: 'translateY(-30px) scaleX(1)', opacity: '0' },
        },
        fadeUp: { from: { opacity: '0', transform: 'translateY(14px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        bounce2: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(8px)' } },
        blink: { '0%,49%': { opacity: '1' }, '50%,100%': { opacity: '0' } },
        floaty: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-9px)' } },
      },
      animation: {
        fillCup: 'fillCup 1.6s ease-out forwards',
        steamRise: 'steamRise 2.2s ease-in-out infinite',
        fadeUp: 'fadeUp .7s ease both',
        bounce2: 'bounce2 1.8s ease-in-out infinite',
        blink: 'blink 1.06s steps(1, end) infinite',
        floaty: 'floaty 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
