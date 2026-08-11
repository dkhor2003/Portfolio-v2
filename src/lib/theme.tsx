import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

export type Theme = 'dark' | 'light'

const STORAGE_KEY = 'theme'

/** Applied by the inline boot script too — keep the two in step. */
export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.documentElement.style.colorScheme = theme
}

export function readStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'dark' || stored === 'light' ? stored : null
  } catch {
    return null
  }
}

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

/**
 * Dark is the default and the OS preference is not consulted: the site is
 * designed dark-first, and a visitor arriving on a light-themed machine should
 * still see it as intended until they choose otherwise. To follow the system
 * instead, fall back to `matchMedia('(prefers-color-scheme: light)')` here and
 * in the boot script in index.html.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  // index.html has already resolved and applied the theme before first paint, so
  // read it back off the element rather than guessing and causing a flash.
  const [theme, setThemeState] = useState<Theme>(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light',
  )

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    applyTheme(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* private mode — the choice just will not persist */
    }
    // Let the page cross-fade, then drop the class so it does not interfere
    // with anything else that animates colour.
    const root = document.documentElement
    root.classList.add('theme-shifting')
    window.setTimeout(() => root.classList.remove('theme-shifting'), 450)
    window.dispatchEvent(new CustomEvent('themechange', { detail: next }))
  }, [])

  const value = useMemo(
    () => ({ theme, setTheme, toggle: () => setTheme(theme === 'dark' ? 'light' : 'dark') }),
    [theme, setTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used inside ThemeProvider')
  return context
}
