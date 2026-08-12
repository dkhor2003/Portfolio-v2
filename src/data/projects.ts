/**
 * Screenshots, picked up automatically — drop a file in assets/projects and
 * reference it by file name below.
 */
const images = import.meta.glob('../assets/projects/*.{png,jpg,jpeg,webp,avif,svg}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const byFileName: Record<string, string> = {}
for (const [path, url] of Object.entries(images)) {
  byFileName[path.split('/').pop()!] = url
}

export interface Project {
  title: string
  /** One or two lines. The panel is narrow — this is a hook, not a write-up. */
  description: string
  /** File name inside assets/projects. Omit and the panel shows a placeholder. */
  image?: string
  /**
   * Skill slugs from data/skills.ts. The logos and labels come from there, so a
   * project's stack always matches what the skills carousel shows.
   */
  stack: string[]
  /** Repository URL. Omit and the icon is left off. */
  github?: string
}

/**
 * The reel the projector cycles through, in order. Each entry gets one turn of
 * the globe, so adding one lengthens the section on its own.
 */
export const projects: Project[] = [
  {
    title: 'Sampling-based Optimized Adaptive Discretization and its Applications in Robotics',
    description: 'A novel approach towards addressing the curse of dimensionality problem in robotics.',
    image: 'oad.png',
    stack: ['python', 'pytorch', 'opencv', 'bash'],
    github: 'https://github.com/ISUSAIL/Adaptive_Discretization',
  },
  // Template — fill these in the same shape. `image` is a file name in
  // assets/projects, `stack` is skill slugs from data/skills.ts.
  {
    title: 'Project Two',
    description: 'Short description of the problem, the approach, and the result.',
    stack: ['typescript', 'react'],
    github: '',
  },
  {
    title: 'Project Three',
    description: 'Short description of the problem, the approach, and the result.',
    stack: ['python', 'docker'],
    github: '',
  },
  {
    title: 'Project Four',
    description: 'Short description of the problem, the approach, and the result.',
    stack: ['java', 'sql'],
    github: '',
  },
]

/** Resolves a project's `image` file name to its bundled URL. */
export const projectImage = (name?: string) => (name ? byFileName[name] : undefined)
