import { aboutImages, heroPin, journey, stopImage } from '../data/journey'
import { detailImages } from '../data/journey-details'
import { latteArt } from '../data/latte'
import { projectImage, projects } from '../data/projects'
import { skills } from '../data/skills'

/**
 * Image warming.
 *
 * The site is photo-heavy, and left alone the browser fetches each picture the
 * moment it is first needed — so a cold visit reveals a page of empty frames
 * that fill in one at a time behind the reader, while a second visit looks
 * perfect because everything is already cached.
 *
 * The fix is to do on the first visit what the cache does on the second: hold
 * the loading curtain until the route's own photos have landed, then fetch the
 * ones behind a click quietly, before anybody asks for them.
 */

/** Resolves once every image has landed, or after `timeout` ms — whichever first. */
export function preloadImages(urls: string[], timeout = 8000): Promise<void> {
  const list = [...new Set(urls.filter(Boolean))]
  if (!list.length) return Promise.resolve()
  const all = Promise.all(list.map(load))
  const cap = new Promise<void>((resolve) => setTimeout(resolve, timeout))
  return Promise.race([all, cap]).then(() => undefined)
}

const load = (src: string) =>
  new Promise<void>((resolve) => {
    const img = new Image()
    img.decoding = 'async'
    // Resolved either way: one missing photo must not hold the page hostage.
    img.onload = () => resolve()
    img.onerror = () => resolve()
    img.src = src
  })

/** Everything the home page paints as you scroll it. */
const homeImages = () => [
  stopImage(heroPin.avatar ?? ''),
  ...journey.map((stop) => stopImage(stop.image)),
  ...skills.map((skill) => skill.logo),
  ...projects.map((project) => projectImage(project.image)),
]

/** Every pour in the gallery. */
const latteImages = () => latteArt.map((item) => item.url)

/** The photos a route will paint, and so the ones its curtain waits on. */
export function routeImages(pathname: string): string[] {
  if (pathname === '/latte-art') return latteImages()
  if (pathname === '/') return homeImages().filter((url): url is string => !!url)
  return []
}

/**
 * What a card opens into. It is a click away with no curtain to hide behind,
 * so it is worth fetching early — but it is not on screen yet, so it waits for
 * a quiet moment rather than competing with the page being read. The gallery
 * is deliberately left out: it is a route, and its own curtain covers it.
 */
export function warmTheRest() {
  const run = () => preloadImages([...aboutImages, ...detailImages], 60_000)
  // Safari only picked this up recently, hence the fallback.
  if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(run, { timeout: 4000 })
  else window.setTimeout(run, 1500)
}
