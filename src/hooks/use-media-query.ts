import { useEffect, useState } from 'react'

/** Live match for a CSS media query, for layout that JS also has to know about. */
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches,
  )

  useEffect(() => {
    const list = window.matchMedia(query)
    const update = () => setMatches(list.matches)
    update()
    list.addEventListener('change', update)
    return () => list.removeEventListener('change', update)
  }, [query])

  return matches
}

/**
 * Width below which a globe and its copy can no longer sit side by side and
 * have to stack. Shared by the journey sections and GlobeScene so the card
 * layout and the globe's placement always agree on which arrangement is live.
 */
export const STACK_BELOW = 1024
export const STACKED_QUERY = `(max-width: ${STACK_BELOW - 1}px)`
