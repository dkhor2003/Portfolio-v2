export const experience = [
  { dates: '2024 — Present', role: 'Senior Software Engineer', company: 'Placeholder Co', description: 'Leading development of interactive product surfaces; mentoring engineers; owning performance budgets.' },
  { dates: '2022 — 2024', role: 'Software Engineer', company: 'Studio Example', description: 'Built customer-facing web apps end to end, from design systems to deployment pipelines.' },
  { dates: '2020 — 2022', role: 'Frontend Engineer', company: 'Startup Name', description: 'Shipped the core web product from 0 to 1; introduced motion and component tooling.' },
  { dates: '2019 — 2020', role: 'Engineering Intern', company: 'Big Tech Inc', description: 'Contributed to internal tooling used by hundreds of engineers daily.' },
];

export const skillGroups = [
  { title: 'Frontend', items: ['React', 'TypeScript', 'Three.js', 'CSS/Motion'] },
  { title: 'Backend', items: ['Node.js', 'Postgres', 'GraphQL', 'Redis'] },
  { title: 'Cloud & Tools', items: ['AWS', 'Docker', 'CI/CD', 'Figma'] },
  { title: 'Currently learning', items: ['WebGPU', 'Rust', 'Latte pours'] },
];

export const projects = [
  { name: 'Project One', description: 'Placeholder description of a shipped product — the problem, the approach, the result.', tags: ['React', 'Three.js'] },
  { name: 'Project Two', description: 'Placeholder description of a shipped product — the problem, the approach, the result.', tags: ['Node', 'Postgres'] },
  { name: 'Project Three', description: 'Placeholder description of a shipped product — the problem, the approach, the result.', tags: ['TypeScript', 'WebGL'] },
  { name: 'Project Four', description: 'Placeholder description of a shipped product — the problem, the approach, the result.', tags: ['Design', 'Motion'] },
];

// Pose keyframes the avatar interpolates between as the hero → contact sections scroll by.
export const avatarKeyframes = [
  { rotY: 0.3, armL: -0.4, armR: -0.5, lap: 1 },
  { rotY: -0.5, armL: 0.2, armR: -0.1, lap: 0.15 },
  { rotY: 0.6, armL: -1.0, armR: 0.3, lap: 0 },
  { rotY: -0.35, armL: -0.7, armR: -0.7, lap: 0 },
  { rotY: 0.4, armL: -0.9, armR: 0.1, lap: 0 },
  { rotY: 0, armL: 0.9, armR: -0.1, lap: 0 },
];

export const sectionIds = ['hero', 'about', 'experience', 'skills', 'projects', 'contact'];
