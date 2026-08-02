# Docs — Portfolio v2 (React + TypeScript + Tailwind + Three.js)

This folder documents how the site is put together, so you can read the source alongside these notes.

## Contents
1. [Project setup](./01-project-setup.md) — tooling choices, how to run it
2. [Architecture](./02-architecture.md) — folder structure, routing, data flow
3. [The 3D avatar](./03-three-js-avatar.md) — how the scroll-driven Three.js figure works
4. [Styling with Tailwind](./04-styling-tailwind.md) — theme tokens, responsive strategy
5. [Interactions](./05-interactions.md) — cursor, forms, image drop slots, loading transition

## Stack at a glance
- **Vite** — dev server + build, chosen over CRA/Next for a fast, config-light SPA (no server-rendering need here).
- **React 18 + TypeScript** — component model and type safety.
- **Tailwind CSS** — utility-first styling; theme tokens defined once in `tailwind.config.js`.
- **react-router-dom** — two routes: `/` (main portfolio) and `/latte-art` (gallery).
- **@react-three/fiber + drei + three** — declarative Three.js; the avatar is written as JSX (`<mesh>`, `<group>`) instead of imperative `new THREE.Mesh(...)` calls.

## Where this came from
This was first prototyped as a single static HTML file (inline styles, a hand-rolled render loop). This version is a rewrite into idiomatic React: state lives in components via hooks, styling moved to Tailwind utility classes, and the Three.js scene moved to react-three-fiber's component model — the same visual design, restructured for a real codebase.
