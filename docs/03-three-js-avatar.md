# The 3D avatar (`Avatar3D.tsx`)

## What it does
A low-poly figure sits fixed on the right side of the hero/about/etc. As you scroll, it smoothly re-poses: typing on a laptop in the hero, then the laptop fades out and the arms/rotation shift into different "poses" per section (about, experience, skills, projects, contact). It's also draggable — grab it to spin it manually.

## How the pose interpolation works
1. `avatarKeyframes` in `content.ts` is an array of 6 pose objects (`{ rotY, armL, armR, lap }`), one per section, in scroll order.
2. `computeScrollTarget()` runs every frame: it reads each section's `offsetTop` via `document.getElementById`, finds which two sections the current scroll position (`scrollY + 40% of viewport height`) sits between, and linearly interpolates (`lerp`) between their two keyframes using how far through that gap you've scrolled (`frac`).
3. Inside `useFrame` (react-three-fiber's per-frame callback, tied to `requestAnimationFrame`), the avatar's *actual* current pose eases toward that target with `pose += (target - pose) * 0.08` — this is what makes the motion feel smooth/springy rather than snapping directly to the scroll position.
4. `lap` (0–1) scales the laptop group and toggles its visibility — this is the "laptop fades out after the hero" effect.

## Why react-three-fiber instead of raw Three.js
- `<Canvas>` owns the renderer, camera, resize handling, and disposal — no manual `renderer.dispose()` / resize listeners to write.
- The scene graph is JSX (`<group>`, `<mesh>`, `<meshStandardMaterial>`), so it's readable top-to-bottom like the rest of the component tree, and props (like `dragOffset`) flow in the same way as any other React data.
- `useFrame` replaces a hand-rolled `requestAnimationFrame` loop.

## Drag-to-spin
`dragOffset` is a `useRef` (not state — updating every pointer-move frame as state would cause a re-render storm). `onPointerDown/Move/Up/Leave` on the wrapping `<div>` update it; `useFrame` adds it to `pose.rotY` each frame. Because it's a ref, dragging doesn't retrigger React renders — only the Three.js frame loop reads it.

## Geometry notes
Built from primitives only (cylinders, an icosahedron for the head, boxes for the laptop, a torus as a ground-ring accent) — no external 3D model file. If you want a closer likeness of yourself, two solid options:
- **Ready Player Me** (readyplayer.me) — free web-based avatar creator, exports a rigged `.glb` matching a selfie/description; load it with drei's `useGLTF` instead of the hand-built primitives.
- **Mixamo** (mixamo.com) — pairs with a Ready Player Me/other rigged model for pre-made animations (typing, walking, etc.) if you want richer per-section poses than manual keyframes.
