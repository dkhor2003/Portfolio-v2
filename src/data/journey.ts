export interface Pin {
  lng: number
  lat: number
  label: string
  /**
   * Optional captions typed out under the pin, one after another on a loop.
   * Only the hero pin uses them, to say plainly that this is where I am now.
   */
  notes?: string[]
}

/** Globe placement while a stop is parked, in viewport fractions. */
export interface Placement {
  /** Centre of the sphere. */
  x: number
  y: number
  /** Radius, as a fraction of the smaller viewport axis. */
  r: number
}

export interface JourneyStop {
  /** Also the section id in the DOM — the globe reads its position from it. */
  id: string
  pin: Pin
  place: Placement
  /** Narrow screens cannot do side-by-side, so the globe sits above the card. */
  placeSmall?: Placement
  /** Side the card rests on, and flies in from. */
  from: "left" | "right"
  year: string
  text: string
}

/** Where the hero globe idles, before the journey takes over. */
export const heroPin: Pin = {
  lng: -93.6,
  lat: 41.6,
  label: "IOWA, USA",
  notes: [
    "↑ you are looking at my desk",
    "↑ currently based here",
    "↑ CST · probably awake",
    "↑ yes, it snows",
  ],
}

const CENTRE: Placement = { x: 0.5, y: 0.5, r: 0.36 }
/**
 * Stacked layout: the globe sits along the bottom edge and the card drops in
 * from above, so neither has to share the width with the other.
 */
const SMALL: Placement = { x: 0.5, y: 0.82, r: 0.34 }

/**
 * The scroll-driven story between the hero and the about section. Each stop is
 * one full-height section: the globe flies to `place`, spins onto `pin` and
 * holds there while the card floats in from `from`.
 */
export const journey: JourneyStop[] = [
  {
    id: "stop-wichita",
    pin: { lng: -97.3301, lat: 37.6872, label: "WICHITA, KANSAS" },
    place: { x: 0.72, y: 0.5, r: 0.4 },
    placeSmall: SMALL,
    from: "left",
    year: "2003",
    text: "I was born here.",
  },
  {
    id: "stop-penang",
    pin: { lng: 100.3288, lat: 5.4141, label: "PENANG, MALAYSIA" },
    place: { x: 0.28, y: 0.5, r: 0.4 },
    placeSmall: SMALL,
    from: "right",
    year: "2005 - 2021",
    text: "Moved to Malaysia at the age of 2, and lived there for 16 years.",
  },
  {
    id: "stop-ames",
    pin: { lng: -93.6199, lat: 42.0347, label: "AMES, IOWA" },
    place: CENTRE,
    placeSmall: SMALL,
    from: "left",
    year: "2021 - 2025",
    text: "Went to Iowa State University. Got my BSc in Bioinformatics and MSc in Computer Science.",
  },
  {
    // Same city as the stop below: the globe holds still here and only the pin
    // travels the short hop from Ames.
    id: "stop-source-allies",
    pin: { lng: -93.7122, lat: 41.6266, label: "URBANDALE, IOWA" },
    place: CENTRE,
    placeSmall: SMALL,
    from: "right",
    year: "2025",
    text: "Landed my first tech job as a Software Engineer Apprentice at Source Allies.",
  },
  {
    // Globe and pin both hold — only the card changes hands.
    id: "stop-musco",
    pin: { lng: -93.7122, lat: 41.6266, label: "URBANDALE, IOWA" },
    place: CENTRE,
    placeSmall: SMALL,
    from: "left",
    year: "2026 - PRESENT",
    text:
      "After receiving my MSc, I started working as a Software Developer as part of Musco Lighting's Emerging Tech group.",
  },
]
