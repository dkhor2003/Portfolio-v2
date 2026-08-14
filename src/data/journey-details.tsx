import type { ComponentType } from 'react'

/**
 * What a card opens into, keyed by stop id. Each entry is a component, so it can
 * hold anything React can render — prose, photo grids, embeds, a live widget
 * with its own state and hooks.
 *
 * A stop is only clickable when `expandable` is true in data/journey.ts; a true
 * stop with no entry here opens to an empty panel.
 *
 * The panel styles the usual tags for you (h3/h4, p, ul, a, img), so plain
 * markup already reads right — reach for classes only when you want more.
 */
export const journeyDetails: Record<string, ComponentType> = {
  'stop-penang': () => (
    <>
      <h3>Growing up in Penang</h3>
      <p>Moved here at two and stayed sixteen years. More to come.</p>
    </>
  ),

  'stop-ames': () => (
    <>
      <h3>Iowa State University</h3>
      <p>BSc in Bioinformatics, then an MSc in Computer Science. More to come.</p>
    </>
  ),

  'stop-source-allies': () => (
    <>
      <h3>Source Allies</h3>
      <p>My first tech job, as a Software Engineer Apprentice. More to come.</p>
    </>
  ),

  'stop-musco': () => (
    <>
      <h3>Musco Lighting — Emerging Tech</h3>
      <p>Software Developer on the Emerging Tech group. More to come.</p>
    </>
  ),

  // Template — anything goes in here. For photos out of assets/about, import
  // `stopImage` from './journey' and call it with the file name.
  //
  // 'stop-id': () => (
  //   <>
  //     <h3>A heading</h3>
  //     <p>Some prose.</p>
  //     <div className="grid gap-4 sm:grid-cols-2">
  //       <img src={stopImage('photo.png')} alt="" />
  //       <img src={stopImage('other.png')} alt="" />
  //     </div>
  //     <iframe title="A demo" src="..." className="aspect-video w-full rounded-2xl border border-line" />
  //   </>
  // ),
}
