import type { ComponentType } from 'react'
import { stopImage } from './journey'
// The standalone three.js page, emitted as its own file and framed below. It
// stays a plain HTML document on purpose: it draws with the r128 global build
// off a CDN, which does not mix with the module three this app bundles.
import muscoToy from '../assets/misc/musco.html?url'

/**
 * Food photos, picked up automatically — drop a file in assets/food and
 * reference it by file name below.
 */
const foodUrls = import.meta.glob('../assets/food/*.{png,jpg,jpeg,webp,avif}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const food: Record<string, string> = {}
for (const [path, url] of Object.entries(foodUrls)) {
  food[path.split('/').pop()!] = url
}

/** Papers out of the robotics lab, newest link first, for the Ames stop. */
const publications = [
  {
    title: 'Sampling-based Optimized Adaptive Discretization and its Applications in Robotics',
    venue: "Master's thesis",
    href: 'https://dr.lib.iastate.edu/entities/publication/4abbe936-fea3-4c02-884c-3992af0a4962',
  },
  {
    title: 'Rethink Repeatable Measures of Robot Performance With Statistical Query',
    venue: 'IEEE Transactions on Robotics',
    href: 'https://ieeexplore.ieee.org/document/11304172',
  },
  {
    title: 'Post-Convergence Sim-to-Real Policy Transfer: A Principled Alternative to Cherry-Picking',
    venue: 'arXiv',
    href: 'https://arxiv.org/abs/2504.15414',
  },
]

/** Iowa State's write-up on the lab. */
const LAB_ARTICLE =
  'https://www.news.iastate.edu/news/value-physical-intelligence-how-researchers-are-working-safely-advance-capabilities-humanoid'

/** The Malaysian food I grew up on, for the Penang stop. */
const penangFood = [
  {
    file: 'nasi_lemak.png',
    name: 'Nasi lemak',
    note: 'Coconut rice with sambal, fried anchovies, peanuts and egg.',
  },
  {
    file: 'roti_canai.png',
    name: 'Roti canai',
    note: 'Flaky griddled flatbread, torn and dipped in dhal or curry.',
  },
  {
    file: 'prawn_mee.png',
    name: 'Prawn mee',
    note: "Penang's prawn and pork broth, noodles, chilli paste on the side.",
  },
  {
    file: 'pan_mee.png',
    name: 'Pan mee',
    note: 'Hand-torn noodles with anchovies, minced pork and greens.',
  },
]

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

      <h4>The food I miss</h4>
      <div className="grid gap-5 sm:grid-cols-2">
        {penangFood.map((dish) => (
          <figure key={dish.file}>
            <img
              src={food[dish.file]}
              alt={dish.name}
              loading="lazy"
              decoding="async"
              className="aspect-[4/3]"
            />
            <figcaption className="mt-2.5">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">{dish.name}</span>
              <span className="mt-1 block text-[13px] leading-relaxed text-fg/70">{dish.note}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </>
  ),

  'stop-ames': () => (
    <>
      <h3>Iowa State University</h3>
      <p>BSc in Bioinformatics, then an MSc in Computer Science.</p>

      {/* Portrait, so it is boxed rather than run full width — at the panel's
          width it would push everything below it off the first screen. */}
      <div className="mx-auto max-w-[20rem]">
        <img src={stopImage('graduate.png')} alt="At my Iowa State graduation." loading="lazy" decoding="async" />
      </div>

      <h4>Graduate Research and Teaching Assistant</h4>
      <p>Courses I taught:</p>
      <ul>
        <li>COMS 1270 — Introduction to Python Programming</li>
        <li>COMS 3110 — Introduction to the Design and Analysis of Algorithms</li>
        <li>COMS 5740 — Introduction to Machine Learning</li>
      </ul>
      <p>Awarded the Teaching Excellence Award in Fall 2024.</p>

      <h4>Research</h4>
      <p>
        I worked under Dr Bowen Weng on adaptive discretization and safety testing techniques in robotics, to
        improve real-world applicability and efficiency. The robots I worked with were Unitree's Go2, G1 and H1-2.
      </p>

      <h4>Publications</h4>
      <ul>
        {publications.map((paper) => (
          <li key={paper.href}>
            <a href={paper.href} target="_blank" rel="noopener noreferrer">
              {paper.title}
            </a>
            <span className="text-dim"> — {paper.venue}</span>
          </li>
        ))}
      </ul>

      <p>
        <a href={LAB_ARTICLE} target="_blank" rel="noopener noreferrer">
          More about the robotics lab ↗
        </a>
      </p>
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

      <h4>Play with it</h4>
      <p>Drag to orbit, scroll to zoom, and click the letters to launch them.</p>
      {/* Sandboxed to scripts only: the toy needs none of this page, and this
          page should not be reachable from it. */}
      <iframe
        src={muscoToy}
        title="MUSCO — a three.js toy"
        loading="lazy"
        sandbox="allow-scripts"
        className="block h-[min(65svh,30rem)] w-full rounded-2xl border border-line bg-ink"
      />
      <p className="!mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-dim">
        Scrolling over the toy zooms it — scroll beside it to read on.{' '}
        <a href={muscoToy} target="_blank" rel="noopener noreferrer">
          Open full screen ↗
        </a>
      </p>
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
