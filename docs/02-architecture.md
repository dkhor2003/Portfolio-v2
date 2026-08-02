# Architecture

## Folder structure
```
src/
  main.tsx            # React root, wraps App in BrowserRouter
  App.tsx              # Shared layout: CustomCursor + Nav render on every route, <Routes> below
  index.css            # Tailwind directives + a few global resets that can't be Tailwind utilities
  data/
    content.ts          # Placeholder copy (experience, skills, projects) + avatar pose keyframes
  components/
    Nav.tsx              # Sticky nav, scrolls to section IDs on the home route, routes to it first if elsewhere
    CustomCursor.tsx     # Dot + trailing ring, expands over any element with the `hoverable` class
    Avatar3D.tsx         # The scroll-driven 3D figure (see 03-three-js-avatar.md)
    ImageDropSlot.tsx    # Drag-and-drop image placeholder, persists to localStorage
  pages/
    Home.tsx             # hero / about / experience / skills / projects / contact — one scrolling page
    LatteArt.tsx         # loading transition + photo gallery
```

## Data flow
All placeholder content (job history, skills, project cards) lives in `src/data/content.ts` as plain arrays/objects — no CMS or fetch layer, since this is meant to be hand-edited. `Home.tsx` imports and `.map()`s over them. Swap in real content by editing that one file; no component changes needed.

## Routing
`App.tsx` renders `<Nav>` and `<CustomCursor>` outside `<Routes>` so they persist across both pages. `Nav`'s section links use `document.getElementById(id)?.scrollIntoView(...)` rather than route changes — an anchor-scroll works because everything lives on one route (`/`). If a nav link is clicked while on `/latte-art`, it first navigates to `/` then scrolls after a short delay (state needs a tick to mount the sections).

## Component sizing convention
Every component that touches layout uses Tailwind's arbitrary-value syntax (`w-[360px]`, `text-[15.5px]`) where the design calls for a value outside Tailwind's default scale, and the `[repeat(auto-fit,minmax(...))]` grid pattern for responsive card grids — this avoids writing `<style>` blocks or CSS modules for one-off values.
