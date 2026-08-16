import type { MediaItemType } from '@/components/ui/interactive-bento-gallery'

/**
 * Every photo in assets/latte_art, picked up automatically — drop a new pour in
 * the folder and it appears in the gallery with no code change.
 */
const files = import.meta.glob('../assets/latte_art/*.{jpg,jpeg,png,webp,avif}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

/**
 * Bento spans, cycled so the mosaic stays varied whatever the photo count. The
 * pours are 3:4 portrait, so the tall cells carry them and the wide ones are
 * kept shallow enough not to crop the cup out.
 */
const SPANS = [
  // Column counts per cycle add up to a whole row at each breakpoint — 1+1+2 and
  // 2+1+1 across four columns, 1+1+1 and 2+1 across three, pairs across two —
  // so the mosaic tiles exactly instead of leaving holes for `dense` to patch.
  'col-span-1 row-span-5 sm:col-span-1 sm:row-span-5 md:col-span-1 md:row-span-5',
  'col-span-1 row-span-5 sm:col-span-1 sm:row-span-5 md:col-span-1 md:row-span-5',
  'col-span-2 row-span-5 sm:col-span-1 sm:row-span-5 md:col-span-2 md:row-span-5',
  'col-span-2 row-span-4 sm:col-span-2 sm:row-span-4 md:col-span-2 md:row-span-4',
  'col-span-1 row-span-4 sm:col-span-1 sm:row-span-4 md:col-span-1 md:row-span-4',
  'col-span-1 row-span-4 sm:col-span-2 sm:row-span-4 md:col-span-1 md:row-span-4',
]

/**
 * Captions, keyed by file name. Anything not listed falls back to a numbered
 * title — fill these in as you go and the gallery picks them up.
 *
 * e.g. 'Image (1).webp': { title: 'Rosetta', desc: 'Six leaves, finally even' },
 */
const captions: Record<string, { title: string; desc?: string }> = {}

/** "Image (2)" must sort before "Image (10)", which a plain sort gets wrong. */
const naturalOrder = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

export const latteArt: MediaItemType[] = Object.entries(files)
  .map(([path, url]) => ({ name: path.split('/').pop() ?? path, url }))
  .sort((a, b) => naturalOrder.compare(a.name, b.name))
  .map(({ name, url }, i) => {
    const caption = captions[name]
    return {
      id: i + 1,
      type: 'image',
      title: caption?.title ?? `Pour ${String(i + 1).padStart(2, '0')}`,
      desc: caption?.desc ?? '',
      url,
      span: SPANS[i % SPANS.length],
    }
  })
