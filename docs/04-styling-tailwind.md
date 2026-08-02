# Styling with Tailwind

## Token strategy
Every color, font, and custom animation used across the site is declared once in `tailwind.config.js`:
- Colors: `ink` (page background), `card` (panel background), `line` (hairline borders), `muted`/`dim` (secondary/tertiary text), `accent` (teal, primary CTA/highlight), `latte` (warm accent used only on the latte-art page and its cross-link).
- Fonts: `font-display` (Space Grotesk — headings), `font-body` (Inter — paragraph text), `font-mono` (JetBrains Mono — labels, tags, code-flavored details).
- Keyframe animations: `fillCup`/`steamRise` (loading screen), `fadeUp` (page-enter), `bounce2` (scroll-cue).

Using `theme.extend` (not overwriting Tailwind's defaults) means the full default scale (spacing, standard colors, etc.) is still available for anything not on-brand.

## Responsive approach
Mobile-first, using Tailwind's default breakpoints (`md:` = 768px). Two concrete examples:
- **Nav**: `hidden md:flex` for the desktop link row, a burger button with `md:hidden` and a slide-down panel below `md:`.
- **Avatar**: full-size (360px) and vertically centered on desktop; an arbitrary-variant media query (`[@media(max-width:820px)]:!w-[110px]` etc.) repositions and shrinks it into the bottom-right corner on small screens so it doesn't cover body text.

Grids throughout (`skills`, `projects`, latte gallery) use `grid-cols-[repeat(auto-fit,minmax(Npx,1fr))]` rather than fixed breakpoint column counts — the column count adapts continuously to viewport width instead of jumping at set breakpoints.

## Where raw CSS still appears
Only in `index.css`, for the handful of things Tailwind utilities can't express: `::selection` color, `scroll-behavior`, and `::placeholder` color (Tailwind's `placeholder-*` utilities exist but the design wanted one global default rather than per-input classes).
