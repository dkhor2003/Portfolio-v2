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
    title: '3D Modeler',
    description: 'Interface for designing object and landscape models that is compatible with Blender and SolidWorks.',
    image: '3d_modeler.png',
    stack: ['c++', 'vulkan'],
    github: 'https://github.com/dkhor2003/3D_Modeler',
  },
  {
    title: 'Randomized Progressive Deblurring',
    description: 'A novel progressive training approach for image classification models to improve generalization.',
    image: 'progressive_deblurring.png',
    stack: ['python', 'pytorch'],
    github: 'https://github.com/dkhor2003/Progressive-Resizing-With-Randomized-Progressive-Deblurring',
  },
  {
    title: 'v2 Portfolio Website',
    description: 'Version 2 of my personal portfolio website designed and developed to showcase my projects, technical skills, experience, and creative work. Integrated 3D visuals and scroll animations for a more engaging experience while ensuring responsiveness across different devices.',
    image: 'portfolio_v2.png',
    stack: ['typescript', 'react', 'tailwind-css', 'three', 'vite'],
    github: 'https://github.com/dkhor2003/Portfolio-v2',
  },
]

/** Resolves a project's `image` file name to its bundled URL. */
export const projectImage = (name?: string) => (name ? byFileName[name] : undefined)
