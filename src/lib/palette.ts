/**
 * The current theme's colours, resolved from CSS variables for canvas code.
 *
 * The globes and the projector are drawn by hand and cannot use Tailwind
 * classes, so they read the same tokens the stylesheet does. Values are cached
 * and refreshed on `themechange`, which ThemeProvider fires — resolving custom
 * properties per frame would mean a style recalculation on every draw.
 */
export interface Palette {
  /** Wireframe and graticule strokes. */
  line: [number, number, number]
  /** Halftone land dots. */
  dot: [number, number, number]
  /** Extra multiplier on stroke alpha — light needs stronger lines to read. */
  lineAlpha: number
  accent: [number, number, number]
  ink: [number, number, number]
  fg: [number, number, number]
  muted: [number, number, number]
  /** Additive glow only brightens a dark page; light needs the opposite. */
  dark: boolean
}

const FALLBACK: Palette = {
  line: [255, 255, 255],
  dot: [153, 153, 153],
  lineAlpha: 1,
  accent: [77, 217, 208],
  ink: [10, 10, 15],
  fg: [255, 255, 255],
  muted: [154, 154, 168],
  dark: true,
}

let cache: Palette | null = null

function channels(styles: CSSStyleDeclaration, name: string, fallback: [number, number, number]) {
  const raw = styles.getPropertyValue(name).trim()
  if (!raw) return fallback
  const parts = raw.split(/[\s,]+/).map(Number)
  return parts.length >= 3 && parts.every((n) => Number.isFinite(n))
    ? ([parts[0], parts[1], parts[2]] as [number, number, number])
    : fallback
}

function read(): Palette {
  if (typeof document === 'undefined') return FALLBACK
  const styles = getComputedStyle(document.documentElement)
  const alpha = parseFloat(styles.getPropertyValue('--globe-line-alpha'))
  return {
    line: channels(styles, '--globe-line', FALLBACK.line),
    dot: channels(styles, '--globe-dot', FALLBACK.dot),
    lineAlpha: Number.isFinite(alpha) ? alpha : 1,
    accent: channels(styles, '--accent', FALLBACK.accent),
    ink: channels(styles, '--ink', FALLBACK.ink),
    fg: channels(styles, '--fg', FALLBACK.fg),
    muted: channels(styles, '--muted', FALLBACK.muted),
    dark: document.documentElement.classList.contains('dark'),
  }
}

export function palette(): Palette {
  if (!cache) cache = read()
  return cache
}

/** `rgb(r g b / a)` for a token, ready for a canvas fill or stroke. */
export function rgba(channel: [number, number, number], alpha = 1) {
  return `rgba(${channel[0]}, ${channel[1]}, ${channel[2]}, ${alpha})`
}

if (typeof window !== 'undefined') {
  window.addEventListener('themechange', () => {
    cache = read()
  })
}
