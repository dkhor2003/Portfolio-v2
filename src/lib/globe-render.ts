import * as d3 from "d3"
import type { GlobeData } from "./globe-data"

const DEG = Math.PI / 180
/** Built once — the graticule geometry never changes. */
const graticule = d3.geoGraticule()()

export interface WireframeOptions {
  data: GlobeData | null
  path: d3.GeoPath
  cx: number
  cy: number
  r: number
  /** Current d3 rotation, in degrees. */
  lon: number
  lat: number
  /** Line-weight scale, so a bigger globe gets proportionally heavier strokes. */
  s: number
  /** Alpha for dots on the far side. High = see-through wireframe. */
  backAlpha: number
  landAlpha: number
  /** Canvas bounds, used to skip dots that fall outside it. */
  vw: number
  vh: number
}

/**
 * Places every halftone dot by rotating its unit vector directly. d3's rotation
 * is a spin about the poles followed by a tilt about the y axis, which is two
 * cheap 2D rotations here — worth it over a projection call at ~10k dots a
 * frame.
 */
function drawDots(ctx: CanvasRenderingContext2D, o: WireframeOptions) {
  const dots = o.data!.dots
  const cosA = Math.cos(o.lon * DEG)
  const sinA = Math.sin(o.lon * DEG)
  const cosB = Math.cos(o.lat * DEG)
  const sinB = Math.sin(o.lat * DEG)
  // Squares, not circles: at two-ish pixels they are indistinguishable, and
  // tessellating ten thousand arcs a frame is not.
  const dotR = 1.2 * o.s
  const dotSize = dotR * 2

  for (let pass = 0; pass < 2; pass++) {
    const front = pass === 1
    const alpha = front ? 1 : o.backAlpha
    if (alpha < 0.03) continue

    ctx.beginPath()
    for (let i = 0; i < dots.length; i += 3) {
      const x0 = dots[i]
      const y0 = dots[i + 1]
      const z0 = dots[i + 2]
      // Spin about the poles, then tilt. The tilt is about the y axis, so the
      // y component is already final after the spin.
      const x1 = cosA * x0 - sinA * y0
      const y1 = sinA * x0 + cosA * y0
      const x2 = x1 * cosB - z0 * sinB
      if (x2 > 0 !== front) continue
      const z2 = x1 * sinB + z0 * cosB
      const px = o.cx + o.r * y1
      const py = o.cy - o.r * z2
      if (px < -2 || px > o.vw + 2 || py < -2 || py > o.vh + 2) continue
      ctx.rect(px - dotR, py - dotR, dotSize, dotSize)
    }
    ctx.globalAlpha = alpha
    ctx.fillStyle = "#999999"
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

/**
 * The globe itself: sphere edge, graticule, land outlines and halftone dots.
 * Shared by the scroll-driven scene on the home page and the idle globe on the
 * 404 page, so both read as the same object.
 *
 * Assumes the caller has already pointed `path`'s projection at cx/cy/r/lon/lat.
 */
export function drawWireframe(ctx: CanvasRenderingContext2D, o: WireframeOptions) {
  // Sphere edge. Unfilled, so the page shows through the wireframe.
  ctx.beginPath()
  ctx.arc(o.cx, o.cy, o.r, 0, 2 * Math.PI)
  ctx.strokeStyle = "#ffffff"
  ctx.lineWidth = o.s
  ctx.globalAlpha = 0.18
  ctx.stroke()
  ctx.globalAlpha = 1

  if (!o.data) return

  ctx.beginPath()
  o.path(graticule)
  ctx.strokeStyle = "#ffffff"
  ctx.lineWidth = o.s
  ctx.globalAlpha = 0.14
  ctx.stroke()

  ctx.beginPath()
  o.data.land.features.forEach((feature: any) => o.path(feature))
  ctx.strokeStyle = "#ffffff"
  ctx.lineWidth = o.s
  ctx.globalAlpha = o.landAlpha
  ctx.stroke()
  ctx.globalAlpha = 1

  drawDots(ctx, o)
}
