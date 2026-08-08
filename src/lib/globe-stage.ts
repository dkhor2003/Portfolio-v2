/**
 * Where the contact-section globe currently is on screen, in viewport pixels.
 *
 * ProjectHologram owns the globe and writes this every frame; the contact
 * form's rocket reads it once at launch so it lifts off from the globe's actual
 * surface rather than from a guessed patch of sky.
 */
export interface GlobeStage {
  cx: number
  cy: number
  r: number
  /** Layer opacity. Zero means the globe is not on screen. */
  alpha: number
}

export const contactGlobe: GlobeStage = { cx: 0, cy: 0, r: 0, alpha: 0 }

/**
 * A random point on the part of the globe that is actually visible. Rejection
 * sampling: the visible region is a circle chopped by the viewport edges, which
 * is far more awkward to sample directly than to just try points in the disc.
 */
export function randomPointOnGlobe(vw: number, vh: number): { x: number; y: number } {
  const { cx, cy, r, alpha } = contactGlobe
  if (r > 0 && alpha > 0.05) {
    for (let i = 0; i < 60; i++) {
      const angle = Math.random() * Math.PI * 2
      // sqrt keeps points spread over the disc rather than piled at the centre.
      const radius = Math.sqrt(Math.random()) * r * 0.88
      const x = cx + Math.cos(angle) * radius
      const y = cy + Math.sin(angle) * radius
      if (x > 70 && x < vw - 70 && y > 60 && y < vh * 0.44) return { x, y }
    }
  }
  // Nothing on screen to launch from — use the upper middle of the viewport.
  return { x: vw * (0.35 + Math.random() * 0.3), y: vh * (0.12 + Math.random() * 0.2) }
}
