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
        // Chromatic split: each layer jumps to a new offset and horizontal slice.
        glitchA: {
          '0%,100%': { transform: 'translate3d(0,0,0)', clipPath: 'inset(0 0 100% 0)' },
          '10%': { transform: 'translate3d(-7px,3px,0)', clipPath: 'inset(10% 0 64% 0)' },
          '25%': { transform: 'translate3d(6px,-4px,0)', clipPath: 'inset(46% 0 26% 0)' },
          '40%': { transform: 'translate3d(-5px,2px,0)', clipPath: 'inset(70% 0 6% 0)' },
          '55%': { transform: 'translate3d(8px,3px,0)', clipPath: 'inset(28% 0 50% 0)' },
          '70%': { transform: 'translate3d(-4px,-3px,0)', clipPath: 'inset(58% 0 20% 0)' },
          '85%': { transform: 'translate3d(3px,2px,0)', clipPath: 'inset(2% 0 80% 0)' },
        },
        glitchB: {
          '0%,100%': { transform: 'translate3d(0,0,0)', clipPath: 'inset(0 0 100% 0)' },
          '10%': { transform: 'translate3d(6px,-2px,0)', clipPath: 'inset(56% 0 22% 0)' },
          '25%': { transform: 'translate3d(-8px,3px,0)', clipPath: 'inset(16% 0 58% 0)' },
          '40%': { transform: 'translate3d(4px,-3px,0)', clipPath: 'inset(76% 0 4% 0)' },
          '55%': { transform: 'translate3d(-6px,2px,0)', clipPath: 'inset(36% 0 44% 0)' },
          '70%': { transform: 'translate3d(5px,3px,0)', clipPath: 'inset(6% 0 74% 0)' },
          '85%': { transform: 'translate3d(-3px,-2px,0)', clipPath: 'inset(64% 0 14% 0)' },
        },
        glitchSkew: {
          '0%,100%': { transform: 'skewX(0deg)' },
          '20%': { transform: 'skewX(1.1deg)' },
          '40%': { transform: 'skewX(-0.7deg)' },
          '60%': { transform: 'skewX(0.5deg)' },
          '80%': { transform: 'skewX(-0.9deg)' },
        },
        holoScan: { from: { transform: 'translateY(-100%)' }, to: { transform: 'translateY(420%)' } },
      },
      animation: {
        fillCup: 'fillCup 1.6s ease-out forwards',
        steamRise: 'steamRise 2.2s ease-in-out infinite',
        fadeUp: 'fadeUp .7s ease both',
        bounce2: 'bounce2 1.8s ease-in-out infinite',
        blink: 'blink 1.06s steps(1, end) infinite',
        floaty: 'floaty 6s ease-in-out infinite',
        holoScan: 'holoScan 4.5s linear infinite',
        // steps(1) so the layers snap between states instead of sliding.
        glitchA: 'glitchA 0.4s steps(1, end) infinite',
        glitchB: 'glitchB 0.32s steps(1, end) infinite',
        glitchSkew: 'glitchSkew 0.36s steps(1, end) infinite',
      },
    },
  },
  plugins: [],
};
