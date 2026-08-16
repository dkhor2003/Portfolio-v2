import type { ComponentType } from 'react'
import { stopImage } from './journey'
import { projectImage } from './projects'
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

/** Days out with the Source Allies team, for the apprenticeship stop. */
const sourceAlliesEvents = [
  { file: 'sai_cross_country.png', caption: 'Cross country — Des Moines Corporate Games' },
  { file: 'sai_road_race.png', caption: 'Road race 5K — bronze' },
  { file: 'sai_ragbrai.png', caption: 'RAGBRAI' },
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
      <p>Having lived there for 16 years, I can say I am deeply connected to its culture, community, and most importantly, the <b>FOOD</b>. Always trying to recommend others to give a visit to Penang whenever they have the chance.</p>

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
      <p>BSc in Bioinformatics (<i>Spring 2023</i>), then an MSc in Computer Science (<i>Fall 2025</i>).</p>

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
      <p>I joined as a Software Engineer Apprentice, alongside six other apprentices.</p>

      <img
        src={stopImage('sai_apprentice.png')}
        alt="The Source Allies apprentice cohort."
        loading="lazy"
        decoding="async"
      />

      <p>
        Coming into tech from outside it, I was overwhelmed at first by how much there was to pick up — technical
        skills, industry knowledge and software development practice all at once. Over the apprenticeship I got to
        work across infrastructure as code and cloud services, event-driven architecture, authentication and
        observability, and full-stack AI, all in a consulting environment.
      </p>

      <h4>What I worked on</h4>
      <ul>
        <li>
          Deployed infrastructure as code with Terraform, integrating Azure Functions and Service Bus for
          event-driven, asynchronous communication between an HR tool and dependent systems, reducing response
          times.
        </li>
        <li>
          Improved system security, reliability and observability by migrating to OIDC authentication and
          strengthening monitoring for internal tools.
        </li>
        <li>
          Enhanced an AI-powered chatbot (FastAPI, React) with multi-session support and a retrieval-augmented
          generation pipeline with GitHub integration, increasing response accuracy and usability.
        </li>
      </ul>

      <h4>And it was eventful</h4>
      <p>
        There was always something on — plenty of internal events, and the Des Moines Corporate Games, where I ran
        cross country and the road race 5K on the Source Allies team. I came away from the 5K with a bronze medal.
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        {sourceAlliesEvents.map((event) => (
          <figure key={event.file}>
            <img
              src={stopImage(event.file)}
              alt={event.caption}
              loading="lazy"
              decoding="async"
              className="aspect-[4/3]"
            />
            <figcaption className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-dim">
              {event.caption}
            </figcaption>
          </figure>
        ))}
      </div>
    </>
  ),

  'stop-musco': () => (
    <>
      <h3>Musco Lighting — Emerging Tech</h3>
      <p>
        I joined the Emerging Tech team as a Software Developer, working on Umpire Assist — an AI-powered
        technology that helps umpires call balls and strikes for youth baseball and softball.
      </p>

      <h4>What I have worked on so far</h4>
      <ul>
        <li>
          Integrated Pact contract testing into CI/CD pipelines to automate microservice compatibility validation,
          reducing integration risk and enabling safer deployments.
        </li>
        <li>
          Migrated cloud-to-edge communication from tunnel-based HTTP request/response to an MQTT-based RPC
          architecture (AWS IoT Core, Eclipse Mosquitto), removing the dependency on tunnel availability and
          improving the reliability, monitorability and scalability of command delivery.
        </li>
        <li>
          Rearchitected the edge audio playback pipeline for reliability and performance — direct driver
          integration and software-mixed output in place of subprocess calls, plus automatic recovery from AWS S3
          for missing or corrupted audio files.
        </li>
      </ul>

      <h4>ScoreCast — internal hackathon</h4>
      <p>
        The goal was to build  a flexible scoreboard system: many sports, cloud-connected devices, ads and video, and custom
        overlays. My team built ScoreCast, a display page that shows the scoreboard and a control page that drives
        it live from any device.
      </p>
      <img
        src={projectImage('scorecast.png')}
        alt="The ScoreCast scoreboard."
        loading="lazy"
        decoding="async"
      />
      <p>
        Built with JavaScript, React and Tailwind CSS, on a Supabase Postgres database — its built-in websockets
        push every change from the control page to the display page as it happens.
      </p>

      <h4>On the side</h4>
      <p>
        A small three.js page: the word MUSCO sits on the ground, and clicking any letter blows the whole thing off
        the screen. Drag to orbit, scroll to zoom — feel free to try it out.
      </p>
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
