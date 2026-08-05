export type SkillCategory = 'Language' | 'Library / Framework' | 'Cloud' | 'Developer tool'

export interface Skill {
  slug: string
  name: string
  category: SkillCategory
  /** 0–100. Placeholder values — tune these to taste. */
  level: number
  logo: string
  /** Drawn in black, so it needs inverting to show on the dark background. */
  invert: boolean
}

/** Logo files with no colour of their own, painted black. */
const inverted = new Set(['three'])

/** Chip and progress-bar tint, one per category. */
export const categoryColor: Record<SkillCategory, string> = {
  Language: '#4dd9d0',
  'Library / Framework': '#a78bfa',
  Cloud: '#d99a4d',
  'Developer tool': '#fb7185',
}

const files = import.meta.glob('../assets/logos/*.{svg,png}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

/** File basename (no extension) → its bundled URL. */
const logos: Record<string, string> = {}
for (const [path, url] of Object.entries(files)) {
  logos[path.split('/').pop()!.replace(/\.(svg|png)$/i, '')] = url
}

/**
 * Display order, and the metadata the hover card reads. Interleaved by
 * category on purpose: the carousel splits this list by alternating index, so
 * neighbours here end up in opposite rows.
 */
const defined: Array<[slug: string, name: string, category: SkillCategory, level: number]> = [
  ['python', 'Python', 'Language', 92],
  ['react', 'React', 'Library / Framework', 87],
  ['aws', 'AWS', 'Cloud', 72],
  ['docker', 'Docker', 'Developer tool', 75],
  ['typescript', 'TypeScript', 'Language', 88],
  ['pytorch', 'PyTorch', 'Library / Framework', 76],
  ['azure', 'Azure', 'Cloud', 66],
  ['git', 'Git', 'Developer tool', 89],
  ['javascript', 'JavaScript', 'Language', 86],
  ['three', 'Three.js', 'Library / Framework', 62],
  ['terraform', 'Terraform', 'Developer tool', 64],
  ['java', 'Java', 'Language', 78],
  ['tailwind-css', 'Tailwind CSS', 'Library / Framework', 84],
  ['vite', 'Vite', 'Developer tool', 80],
  ['c++', 'C++', 'Language', 74],
  ['opencv', 'OpenCV', 'Library / Framework', 68],
  ['bash', 'Bash', 'Language', 70],
  ['vulkan', 'Vulkan', 'Library / Framework', 55],
  ['sql', 'SQL', 'Language', 82],
  ['html', 'HTML', 'Language', 90],
  ['css', 'CSS', 'Language', 85],
]

const listed = new Set(defined.map(([slug]) => slug))

export const skills: Skill[] = [
  ...defined
    .filter(([slug]) => logos[slug])
    .map(([slug, name, category, level]) => ({
      slug,
      name,
      category,
      level,
      logo: logos[slug],
      invert: inverted.has(slug),
    })),
  // Anything dropped into assets/logos without an entry above still shows up,
  // with a name derived from the file name.
  ...Object.keys(logos)
    .filter((slug) => !listed.has(slug))
    .sort()
    .map((slug) => ({
      slug,
      name: slug.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      category: 'Developer tool' as SkillCategory,
      level: 60,
      logo: logos[slug],
      invert: inverted.has(slug),
    })),
]
