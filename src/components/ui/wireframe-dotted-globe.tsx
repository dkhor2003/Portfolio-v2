"use client"

import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"

interface RotatingEarthProps {
  width?: number
  height?: number
  className?: string
  /** Longitude/latitude of the "you are here" marker. Defaults to Iowa, USA. */
  marker?: { lng: number; lat: number; label?: string } | null
  markerColor?: string
}

const IOWA = { lng: -93.6, lat: 42.0, label: "Iowa, USA" }

export default function RotatingEarth({
  width = 800,
  height = 600,
  className = "",
  marker = IOWA,
  markerColor = "#4dd9d0",
}: RotatingEarthProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Held in refs so callers can pass an inline object without re-running the
  // effect below (which would refetch the land data on every render).
  const markerRef = useRef(marker)
  markerRef.current = marker
  const markerColorRef = useRef(markerColor)
  markerColorRef.current = markerColor

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const context = canvas.getContext("2d")
    if (!context) return

    let cancelled = false

    // Keep the canvas square. Fitting width and height independently leaves a
    // tall empty box on narrow viewports, since the sphere is sized by the
    // smaller axis either way.
    const size = Math.max(
      200,
      Math.min(width, height, window.innerWidth - 40, window.innerHeight - 100),
    )
    const containerWidth = size
    const containerHeight = size
    const radius = size / 2.5

    const dpr = window.devicePixelRatio || 1
    canvas.width = containerWidth * dpr
    canvas.height = containerHeight * dpr
    canvas.style.width = `${containerWidth}px`
    canvas.style.height = `${containerHeight}px`
    context.scale(dpr, dpr)

    // Create projection and path generator for Canvas
    const projection = d3
      .geoOrthographic()
      .scale(radius)
      .translate([containerWidth / 2, containerHeight / 2])
      .clipAngle(90)

    const path = d3.geoPath().projection(projection).context(context)

    const pointInPolygon = (point: [number, number], polygon: number[][]): boolean => {
      const [x, y] = point
      let inside = false

      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [xi, yi] = polygon[i]
        const [xj, yj] = polygon[j]

        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
          inside = !inside
        }
      }

      return inside
    }

    const pointInFeature = (point: [number, number], feature: any): boolean => {
      const geometry = feature.geometry

      if (geometry.type === "Polygon") {
        const coordinates = geometry.coordinates
        // Check if point is in outer ring
        if (!pointInPolygon(point, coordinates[0])) {
          return false
        }
        // Check if point is in any hole (inner rings)
        for (let i = 1; i < coordinates.length; i++) {
          if (pointInPolygon(point, coordinates[i])) {
            return false // Point is in a hole
          }
        }
        return true
      } else if (geometry.type === "MultiPolygon") {
        // Check each polygon in the MultiPolygon
        for (const polygon of geometry.coordinates) {
          // Check if point is in outer ring
          if (pointInPolygon(point, polygon[0])) {
            // Check if point is in any hole
            let inHole = false
            for (let i = 1; i < polygon.length; i++) {
              if (pointInPolygon(point, polygon[i])) {
                inHole = true
                break
              }
            }
            if (!inHole) {
              return true
            }
          }
        }
        return false
      }

      return false
    }

    const generateDotsInPolygon = (feature: any, dotSpacing = 16) => {
      const dots: [number, number][] = []
      const bounds = d3.geoBounds(feature)
      const [[minLng, minLat], [maxLng, maxLat]] = bounds

      const stepSize = dotSpacing * 0.08

      for (let lng = minLng; lng <= maxLng; lng += stepSize) {
        for (let lat = minLat; lat <= maxLat; lat += stepSize) {
          const point: [number, number] = [lng, lat]
          if (pointInFeature(point, feature)) {
            dots.push(point)
          }
        }
      }

      return dots
    }

    interface DotData {
      lng: number
      lat: number
      visible: boolean
    }

    const allDots: DotData[] = []
    let landFeatures: any
    let elapsedMs = 0

    // Draws the "you are here" pin: a label, a downward arrow and a pulsing dot.
    const renderMarker = (scaleFactor: number) => {
      const marker = markerRef.current
      if (!marker) return

      const projected = projection([marker.lng, marker.lat])
      if (!projected) return

      // Hide the pin once the location rotates past the horizon.
      const [lambda, phi] = projection.rotate()
      const center: [number, number] = [-lambda, -phi]
      const distance = d3.geoDistance([marker.lng, marker.lat], center)
      const fade = Math.max(0, Math.min(1, (Math.PI / 2 - distance) / 0.35))
      if (fade <= 0) return

      const [x, y] = projected
      const s = scaleFactor

      context.save()
      context.globalAlpha = fade
      context.strokeStyle = markerColorRef.current
      context.fillStyle = markerColorRef.current

      // Pulsing rings radiating from the location
      const pulse = (elapsedMs % 2200) / 2200
      context.lineWidth = 1.5 * s
      context.globalAlpha = fade * (1 - pulse) * 0.7
      context.beginPath()
      context.arc(x, y, (4 + pulse * 20) * s, 0, 2 * Math.PI)
      context.stroke()

      // Solid dot on the location
      context.globalAlpha = fade
      context.beginPath()
      context.arc(x, y, 4.5 * s, 0, 2 * Math.PI)
      context.fill()

      // Arrow shaft pointing down at the dot
      const tipY = y - 14 * s
      const tailY = y - 52 * s
      context.lineWidth = 2 * s
      context.beginPath()
      context.moveTo(x, tailY)
      context.lineTo(x, tipY)
      context.stroke()

      // Arrowhead
      context.beginPath()
      context.moveTo(x, y - 7 * s)
      context.lineTo(x - 6.5 * s, tipY - 3 * s)
      context.lineTo(x + 6.5 * s, tipY - 3 * s)
      context.closePath()
      context.fill()

      // Label above the arrow, with a soft halo so it stays legible over the wireframe
      if (marker.label) {
        context.font = `700 ${18 * s}px ui-monospace, SFMono-Regular, Menlo, monospace`
        context.textAlign = "center"
        context.textBaseline = "bottom"
        context.letterSpacing = `${1.5 * s}px`
        context.shadowColor = "rgba(10, 10, 15, 0.95)"
        context.shadowBlur = 12 * s
        context.fillText(marker.label, x, tailY - 9 * s)
        // Second pass thickens the glyphs against the busy background
        context.fillText(marker.label, x, tailY - 9 * s)
        context.shadowBlur = 0
      }

      context.restore()
    }

    const render = () => {
      // Clear canvas
      context.clearRect(0, 0, containerWidth, containerHeight)

      const currentScale = projection.scale()
      const scaleFactor = currentScale / radius

      // Globe edge. No fill, so the page background shows through the sphere.
      context.beginPath()
      context.arc(containerWidth / 2, containerHeight / 2, currentScale, 0, 2 * Math.PI)
      context.strokeStyle = "#ffffff"
      context.lineWidth = 1 * scaleFactor
      context.globalAlpha = 0.18
      context.stroke()
      context.globalAlpha = 1

      if (landFeatures) {
        // Draw graticule
        const graticule = d3.geoGraticule()
        context.beginPath()
        path(graticule())
        context.strokeStyle = "#ffffff"
        context.lineWidth = 1 * scaleFactor
        context.globalAlpha = 0.14
        context.stroke()
        context.globalAlpha = 1

        // Draw land outlines
        context.beginPath()
        landFeatures.features.forEach((feature: any) => {
          path(feature)
        })
        context.strokeStyle = "#ffffff"
        context.lineWidth = 1 * scaleFactor
        context.globalAlpha = 0.5
        context.stroke()
        context.globalAlpha = 1

        // Draw halftone dots
        allDots.forEach((dot) => {
          const projected = projection([dot.lng, dot.lat])
          if (
            projected &&
            projected[0] >= 0 &&
            projected[0] <= containerWidth &&
            projected[1] >= 0 &&
            projected[1] <= containerHeight
          ) {
            context.beginPath()
            context.arc(projected[0], projected[1], 1.2 * scaleFactor, 0, 2 * Math.PI)
            context.fillStyle = "#999999"
            context.fill()
          }
        })

        renderMarker(scaleFactor)
      }
    }

    const loadWorldData = async () => {
      try {
        setIsLoading(true)

        const response = await fetch(
          "https://raw.githubusercontent.com/martynafford/natural-earth-geojson/refs/heads/master/110m/physical/ne_110m_land.json",
        )
        if (!response.ok) throw new Error("Failed to load land data")

        const data = await response.json()
        if (cancelled) return
        landFeatures = data

        // Generate dots for all land features
        landFeatures.features.forEach((feature: any) => {
          const dots = generateDotsInPolygon(feature, 16)
          dots.forEach(([lng, lat]) => {
            allDots.push({ lng, lat, visible: true })
          })
        })

        render()
        setIsLoading(false)
      } catch (err) {
        if (cancelled) return
        setError("Failed to load land map data")
        setIsLoading(false)
      }
    }

    // Set up rotation and interaction
    const rotation: [number, number] = [0, 0]
    let autoRotate = true
    const rotationSpeed = 0.5

    // Renders every frame (not just while auto-rotating) so the marker keeps pulsing
    // while the user is dragging.
    const rotate = (elapsed: number) => {
      elapsedMs = elapsed
      if (autoRotate) {
        rotation[0] += rotationSpeed
        projection.rotate(rotation)
      }
      render()
    }

    // Auto-rotation timer
    const rotationTimer = d3.timer(rotate)

    const handleMouseDown = (event: MouseEvent) => {
      autoRotate = false
      const startX = event.clientX
      const startY = event.clientY
      const startRotation = [...rotation]

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const sensitivity = 0.5
        const dx = moveEvent.clientX - startX
        const dy = moveEvent.clientY - startY

        rotation[0] = startRotation[0] + dx * sensitivity
        rotation[1] = startRotation[1] - dy * sensitivity
        rotation[1] = Math.max(-90, Math.min(90, rotation[1]))

        projection.rotate(rotation)
        render()
      }

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)

        setTimeout(() => {
          autoRotate = true
        }, 10)
      }

      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      const scaleFactor = event.deltaY > 0 ? 0.9 : 1.1
      const newRadius = Math.max(radius * 0.5, Math.min(radius * 3, projection.scale() * scaleFactor))
      projection.scale(newRadius)
      render()
    }

    canvas.addEventListener("mousedown", handleMouseDown)
    canvas.addEventListener("wheel", handleWheel, { passive: false })

    // Load the world data
    loadWorldData()

    // Cleanup
    return () => {
      cancelled = true
      rotationTimer.stop()
      canvas.removeEventListener("mousedown", handleMouseDown)
      canvas.removeEventListener("wheel", handleWheel)
    }
  }, [width, height])

  if (error) {
    return (
      <div className={`dark flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <p className="dark text-destructive font-semibold mb-2">Error loading Earth visualization</p>
          <p className="dark text-muted-foreground text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`dark relative ${className}`}>
      {/* Width/height are set in px by the effect, so no sizing utilities here. */}
      <canvas ref={canvasRef} className="cursor-grab active:cursor-grabbing" />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
          Loading map data…
        </div>
      )}
    </div>
  )
}
