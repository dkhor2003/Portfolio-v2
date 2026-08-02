/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0a0a0f',
        card: '#121218',
        line: 'rgba(255,255,255,0.08)',
        muted: '#9a9aa8',
        dim: '#5a5a68',
        accent: '#4dd9d0',
        latte: '#d99a4d',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
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
      },
      animation: {
        fillCup: 'fillCup 1.6s ease-out forwards',
        steamRise: 'steamRise 2.2s ease-in-out infinite',
        fadeUp: 'fadeUp .7s ease both',
        bounce2: 'bounce2 1.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
