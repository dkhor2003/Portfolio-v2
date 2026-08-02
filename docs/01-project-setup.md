# Project setup

## Install & run
```
npm install
npm run dev      # starts Vite dev server, http://localhost:5173
npm run build    # type-checks (tsc -b) then builds to dist/
npm run preview  # serves the production build locally
```

## Why these tools
- **Vite**: instant HMR, zero-config TS/JSX support, small config surface (`vite.config.ts` is 4 lines). A portfolio site has no need for Next.js's server rendering/data-fetching — Vite keeps it simple.
- **Tailwind**: avoids maintaining a separate CSS file per component; the design's tokens (colors, fonts, radii) live in one place (`tailwind.config.js`) and every class is traceable back to it.
- **react-three-fiber**: lets the 3D scene be described declaratively (`<mesh>`, `<group>`, props) instead of manually creating and disposing Three.js objects — it also handles the render loop, resize, and disposal for you via `<Canvas>`.
- **react-router-dom**: the two "pages" (main site, latte-art gallery) are really two routes in one SPA, sharing the nav/cursor components — simpler than static multi-page HTML.

## Key config files
- `tailwind.config.js` — color tokens (`ink`, `card`, `accent`, `latte`, `muted`, `dim`), font families, and the custom keyframe animations used by the loading screen (`fillCup`, `steamRise`) and hero scroll cue (`bounce2`).
- `postcss.config.js` — wires Tailwind + Autoprefixer into the Vite build.
- `tsconfig.json` — standard Vite React template; `strict: true` is on.
