# Interactions

## Custom cursor (`CustomCursor.tsx`)
Two elements track the mouse: a small dot (1:1 with the pointer) and a larger ring that trails behind it (eased toward the pointer position each frame: `ring += (mouse - ring) * 0.18`, the same easing pattern used for the avatar's pose). Any element with the `hoverable` class expands the ring on hover — add that class to any new interactive element (buttons, links, cards) to opt it in; nothing else needs to change. Disabled entirely on touch devices (`matchMedia('(pointer: fine)')`) since a synthetic cursor makes no sense without a mouse.

## Contact form
Plain controlled inputs (`useState` object `{name, email, message}`); `onSubmit` just flips a `submitted` boolean and swaps the form for a confirmation message — there's no backend wired up. To make it real: point `onSubmit` at an API route, a service like Formspree, or a serverless function, and keep the same success/error UI swap.

## Image drop slots (`ImageDropSlot.tsx`)
Used on the latte-art gallery. Each slot:
1. Accepts a dropped file (`onDrop`) or a click-to-browse `<input type="file">`.
2. Reads it via `FileReader.readAsDataURL` and stores the result as a data URL in `localStorage` under `image-slot:<id>`.
3. On mount, checks localStorage for that key and shows the saved image if present — so photos persist across reloads without a backend.

For a production site with many/large images, swap the `localStorage` data-URL approach for actual file uploads to a host (e.g., an object storage bucket) and store just the resulting URL.

## Loading transition (`LatteArt.tsx`)
On mount: after 1.5s, `opacity` state flips to 0 (triggering the CSS `transition-opacity duration-500`); after 2s, the overlay unmounts entirely (`loading = false`). The cup itself is pure CSS (`animate-fillCup`, a `height` keyframe) plus three staggered `animate-steamRise` divs — no canvas/JS animation needed for this one.
