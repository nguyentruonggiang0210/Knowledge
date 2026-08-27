import { useCallback, useEffect, useMemo, useState } from 'react'
import { searchKnowledgeCatalog } from '../../application/use-cases/searchKnowledgeCatalog'
import type { KnowledgeTopic } from '../../domain/knowledge/KnowledgeTopic'

function readTopicId(topics: readonly KnowledgeTopic[]) {
  if (typeof window === 'undefined') return topics[0]?.id ?? ''
  const queryId = new URLSearchParams(window.location.search).get('topic') ?? ''
  return topics.some((topic) => topic.id === queryId)
    ? queryId
    : (topics[0]?.id ?? '')
}

export function useKnowledgeExplorer(topics: readonly KnowledgeTopic[]) {
  const [activeTopicId, setActiveTopicId] = useState(() => readTopicId(topics))
  const [query, setQuery] = useState('')

  const activeIndex = Math.max(
    0,
    topics.findIndex((topic) => topic.id === activeTopicId),
  )
  const activeTopic = topics[activeIndex]
  const searchResults = useMemo(
    () => searchKnowledgeCatalog(topics, query),
    [query, topics],
  )

  useEffect(() => {
    const syncFromHistory = () => {
      setActiveTopicId(readTopicId(topics))
      setQuery('')
    }
    window.addEventListener('popstate', syncFromHistory)
    return () => window.removeEventListener('popstate', syncFromHistory)
  }, [topics])

  const selectTopic = useCallback(
    (topicId: string) => {
      setActiveTopicId(topicId)
      setQuery('')
      if (topicId !== activeTopicId) {
        const url = new URL(window.location.href)
        url.searchParams.set('topic', topicId)
        url.hash = ''
        window.history.pushState(null, '', url)
      }
      const reducedMotion = window.matchMedia?.(
        '(prefers-reduced-motion: reduce)',
      ).matches
      window.scrollTo({
        top: 0,
        behavior: reducedMotion ? 'auto' : 'smooth',
      })
    },
    [activeTopicId],
  )

  const selectPrevious = useCallback(() => {
    const previous = topics[activeIndex - 1]
    if (previous) selectTopic(previous.id)
  }, [activeIndex, selectTopic, topics])

  const selectNext = useCallback(() => {
    const next = topics[activeIndex + 1]
    if (next) selectTopic(next.id)
  }, [activeIndex, selectTopic, topics])

  return {
    activeIndex,
    activeTopic,
    query,
    searchResults,
    setQuery,
    selectTopic,
    selectPrevious,
    selectNext,
  }
}
