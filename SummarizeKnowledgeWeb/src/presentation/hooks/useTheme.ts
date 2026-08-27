import { useCallback, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'
const STORAGE_KEY = 'knowledge-atlas-theme'

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light'

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // Storage có thể bị chặn; tiếp tục dùng system preference.
  }

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
    try {
      window.localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // Theme vẫn hoạt động trong session khi storage bị chặn.
    }
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'light' ? 'dark' : 'light'))
  }, [])

  return { theme, toggleTheme }
}
