import * as d3 from "d3"

const LAND_URL =
  "https://raw.githubusercontent.com/martynafford/natural-earth-geojson/refs/heads/master/110m/physical/ne_110m_land.json"

const DEG = Math.PI / 180
/** Angular spacing of the halftone dots, in degrees. */
const DOT_STEP = 1.28

export interface GlobeData {
  land: any
  /** Unit vectors, 3 floats per dot: x, y, z on the unit sphere. */
  dots: Float32Array
}

function pointInRing(point: [number, number], ring: number[][]): boolean {
  const [x, y] = point
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

function pointInPolygon(point: [number, number], rings: number[][][]): boolean {
  if (!pointInRing(point, rings[0])) return false
  for (let i = 1; i < rings.length; i++) if (pointInRing(point, rings[i])) return false
  return true
}

function pointInFeature(point: [number, number], feature: any): boolean {
  const geometry = feature.geometry
  if (geometry.type === "Polygon") return pointInPolygon(point, geometry.coordinates)
  if (geometry.type === "MultiPolygon") {
    for (const polygon of geometry.coordinates) if (pointInPolygon(point, polygon)) return true
  }
  return false
}

/**
 * Samples a lat/lng grid inside every land polygon and stores each hit as a unit
 * vector. Vectors let the render loop place a dot with a handful of
 * multiplications instead of a full d3 projection call — worth it at ~10k dots
 * a frame.
 */
function buildDots(land: any): Float32Array {
  const out: number[] = []
  land.features.forEach((feature: any) => {
    const [[minLng, minLat], [maxLng, maxLat]] = d3.geoBounds(feature)
    for (let lng = minLng; lng <= maxLng; lng += DOT_STEP) {
      for (let lat = minLat; lat <= maxLat; lat += DOT_STEP) {
        if (!pointInFeature([lng, lat], feature)) continue
        const cosLat = Math.cos(lat * DEG)
        out.push(cosLat * Math.cos(lng * DEG), cosLat * Math.sin(lng * DEG), Math.sin(lat * DEG))
      }
    }
  })
  return Float32Array.from(out)
}

let promise: Promise<GlobeData> | null = null

/**
 * Fetches the land outlines and derives the halftone dots. Shared across the
 * app: the loading screen kicks this off on boot and waits for it, so the globe
 * is already drawn by the time the page is revealed.
 */
export function loadGlobeData(): Promise<GlobeData> {
  if (!promise) {
    promise = fetch(LAND_URL)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load land data")
        return res.json()
      })
      .then((land) => ({ land, dots: buildDots(land) }))
  }
  return promise
}
