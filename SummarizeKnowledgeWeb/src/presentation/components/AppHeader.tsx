import { BookOpen, Moon, Search, Sun } from 'lucide-react'
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import type { KnowledgeSearchResult } from '../../domain/knowledge/KnowledgeTopic'
import { useI18n } from '../i18n/I18nProvider'
import { TopicIcon } from './TopicIcon'

interface AppHeaderProps {
  readonly query: string
  readonly results: readonly KnowledgeSearchResult[]
  readonly theme: 'light' | 'dark'
  readonly onQueryChange: (value: string) => void
  readonly onSelectTopic: (topicId: string) => void
  readonly onToggleTheme: () => void
}

interface ThemeButtonProps {
  readonly className: string
  readonly theme: 'light' | 'dark'
  readonly onToggle: () => void
}

function ThemeButton({ className, theme, onToggle }: ThemeButtonProps) {
  const { t } = useI18n()
  return (
    <button
      className={className}
      type="button"
      onClick={onToggle}
      aria-label={theme === 'light' ? t('theme.enableDark') : t('theme.enableLight')}
      title={theme === 'light' ? t('theme.dark') : t('theme.light')}
    >
      {theme === 'light' ? (
        <Moon size={19} aria-hidden="true" />
      ) : (
        <Sun size={19} aria-hidden="true" />
      )}
    </button>
  )
}

function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n()

  return (
    <div className="language-switcher" role="group" aria-label={t('language.label')}>
      <button
        type="button"
        data-active={locale === 'vi'}
        aria-pressed={locale === 'vi'}
        title={t('language.vietnamese')}
        onClick={() => setLocale('vi')}
      >
        VI
      </button>
      <button
        type="button"
        data-active={locale === 'en'}
        aria-pressed={locale === 'en'}
        title={t('language.english')}
        onClick={() => setLocale('en')}
      >
        EN
      </button>
    </div>
  )
}

export function AppHeader({
  query,
  results,
  theme,
  onQueryChange,
  onSelectTopic,
  onToggleTheme,
}: AppHeaderProps) {
  const { t } = useI18n()
  const hasQuery = query.trim().length > 0
  const searchInput = useRef<HTMLInputElement>(null)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [activeResultIndex, setActiveResultIndex] = useState(0)
  const [announcement, setAnnouncement] = useState('')
  const isSearchOpen = hasQuery && isSearchFocused
  const selectedResultIndex =
    results.length === 0 ? -1 : Math.min(activeResultIndex, results.length - 1)

  const selectResult = (topicId: string) => {
    const topicTitle = results.find((result) => result.topic.id === topicId)?.topic.title
    onSelectTopic(topicId)
    setAnnouncement(
      topicTitle ? t('search.openedTopic', { title: topicTitle }) : t('search.opened'),
    )
    window.requestAnimationFrame(() => searchInput.current?.focus())
  }

  const navigateResults = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape' && hasQuery) {
      event.preventDefault()
      onQueryChange('')
      setActiveResultIndex(0)
      return
    }
    if (!isSearchOpen || results.length === 0) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveResultIndex((current) => (current + 1) % results.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveResultIndex(
        (current) => (current - 1 + results.length) % results.length,
      )
    } else if (event.key === 'Enter' && selectedResultIndex >= 0) {
      event.preventDefault()
      selectResult(results[selectedResultIndex].topic.id)
    }
  }

  useEffect(() => {
    const focusSearch = (event: globalThis.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchInput.current?.focus()
      }
    }

    window.addEventListener('keydown', focusSearch)
    return () => window.removeEventListener('keydown', focusSearch)
  }, [])

  useEffect(() => {
    if (!isSearchOpen || selectedResultIndex < 0) return
    document
      .getElementById(`search-result-${results[selectedResultIndex].topic.id}`)
      ?.scrollIntoView?.({ block: 'nearest' })
  }, [isSearchOpen, results, selectedResultIndex])

  return (
    <header className="app-header">
      <a className="brand" href="#top" aria-label={t('brand.home')}>
        <span className="brand__mark">
          <BookOpen size={19} strokeWidth={1.9} aria-hidden="true" />
        </span>
        <span>
          <strong>Knowledge Atlas</strong>
          <small>{t('brand.subtitle')}</small>
        </span>
      </a>

      <div className="search-box" role="search">
        <Search size={18} strokeWidth={1.8} aria-hidden="true" />
        <input
          ref={searchInput}
          aria-label={t('search.label')}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isSearchOpen}
          aria-controls="knowledge-search-results"
          aria-activedescendant={
            isSearchOpen && selectedResultIndex >= 0
              ? `search-result-${results[selectedResultIndex].topic.id}`
              : undefined
          }
          type="search"
          value={query}
          placeholder={t('search.placeholder')}
          onChange={(event) => {
            onQueryChange(event.target.value)
            setActiveResultIndex(0)
          }}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
          onKeyDown={navigateResults}
        />
        <kbd>Ctrl K</kbd>

        {isSearchOpen && (
          <div
            id="knowledge-search-results"
            className="search-results"
            role="listbox"
            aria-label={t('search.results')}
          >
            {results.length > 0 ? (
              results.map((result, index) => (
                <div
                  id={`search-result-${result.topic.id}`}
                  role="option"
                  aria-selected={index === selectedResultIndex}
                  className="search-result"
                  key={result.topic.id}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActiveResultIndex(index)}
                  onClick={() => selectResult(result.topic.id)}
                >
                  <span
                    className="search-result__icon"
                    data-accent={result.topic.accent}
                  >
                    <TopicIcon name={result.topic.icon} size={18} />
                  </span>
                  <span>
                    <strong>{result.topic.title}</strong>
                    <small>{result.excerpt}</small>
                  </span>
                </div>
              ))
            ) : (
              <div className="search-results__empty">
                {t('search.noResults', { query })}
              </div>
            )}
          </div>
        )}
      </div>

      <span className="sr-only" aria-live="polite">
        {announcement}
      </span>

      <div className="header-actions">
        <LanguageSwitcher />
        <ThemeButton
          className="icon-button"
          theme={theme}
          onToggle={onToggleTheme}
        />
      </div>
    </header>
  )
}
