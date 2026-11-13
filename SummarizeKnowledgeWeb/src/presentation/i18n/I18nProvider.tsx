import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { messages, supportedLocales, type Locale, type MessageKey } from './messages'

const localeStorageKey = 'knowledge-atlas-locale'

type MessageValues = Readonly<Record<string, string | number>>

interface I18nContextValue {
  readonly locale: Locale
  readonly setLocale: (locale: Locale) => void
  readonly t: (key: MessageKey, values?: MessageValues) => string
  readonly formatNumber: (value: number) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

function isLocale(value: string | null | undefined): value is Locale {
  return supportedLocales.includes(value as Locale)
}

function readInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'vi'
  const queryLocale = new URLSearchParams(window.location.search).get('lang')
  if (isLocale(queryLocale)) return queryLocale
  try {
    const storedLocale = localStorage.getItem(localeStorageKey)
    if (isLocale(storedLocale)) return storedLocale
  } catch {
    // Continue with browser preference if storage is blocked.
  }
  return 'vi'
}

function interpolate(template: string, values: MessageValues = {}) {
  return template.replace(/\{(\w+)}/g, (match, key: string) =>
    Object.hasOwn(values, key) ? String(values[key]) : match,
  )
}

export function I18nProvider({ children }: { readonly children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readInitialLocale)

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale)
    try {
      localStorage.setItem(localeStorageKey, nextLocale)
    } catch {
      // Locale remains available for the current session when storage is blocked.
    }
    const url = new URL(window.location.href)
    url.searchParams.set('lang', nextLocale)
    window.history.replaceState(null, '', url)
  }, [])

  const t = useCallback(
    (key: MessageKey, values?: MessageValues) =>
      interpolate(messages[locale][key], values),
    [locale],
  )

  const formatNumber = useCallback(
    (value: number) => new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US').format(value),
    [locale],
  )

  useEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dataset.locale = locale
    document.title = messages[locale]['meta.title']
    document
      .querySelector<HTMLMetaElement>('meta[name="description"]')
      ?.setAttribute('content', messages[locale]['meta.description'])
  }, [locale])

  const value = useMemo(
    () => ({ locale, setLocale, t, formatNumber }),
    [formatNumber, locale, setLocale, t],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useI18n must be used within I18nProvider')
  return context
}
