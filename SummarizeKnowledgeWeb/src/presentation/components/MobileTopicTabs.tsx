import { Check } from 'lucide-react'
import { useEffect, useRef, type KeyboardEvent } from 'react'
import type { KnowledgeTopic } from '../../domain/knowledge/KnowledgeTopic'
import { TopicIcon } from './TopicIcon'

interface MobileTopicTabsProps {
  readonly topics: readonly KnowledgeTopic[]
  readonly activeTopicId: string
  readonly completed: ReadonlySet<string>
  readonly onSelect: (topicId: string) => void
}

export function MobileTopicTabs({
  topics,
  activeTopicId,
  completed,
  onSelect,
}: MobileTopicTabsProps) {
  const tabList = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const activeTab = tabList.current?.querySelector<HTMLElement>(
      '[role="tab"][aria-selected="true"]',
    )
    const reducedMotion = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    ).matches
    activeTab?.scrollIntoView?.({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'nearest',
      inline: 'center',
    })
  }, [activeTopicId])

  const moveWithKeyboard = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | undefined
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % topics.length
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + topics.length) % topics.length
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = topics.length - 1
    if (nextIndex === undefined) return

    event.preventDefault()
    const nextTopic = topics[nextIndex]
    onSelect(nextTopic.id)
    window.requestAnimationFrame(() =>
      document.getElementById(`mobile-tab-${nextTopic.id}`)?.focus(),
    )
  }

  return (
    <div
      ref={tabList}
      className="mobile-tabs"
      role="tablist"
      aria-label="Danh mục kiến thức"
    >
      {topics.map((topic, index) => (
        <button
          key={topic.id}
          id={`mobile-tab-${topic.id}`}
          type="button"
          role="tab"
          aria-selected={topic.id === activeTopicId}
          aria-controls="knowledge-panel"
          tabIndex={topic.id === activeTopicId ? 0 : -1}
          className="mobile-tab"
          data-active={topic.id === activeTopicId}
          data-accent={topic.accent}
          onClick={() => onSelect(topic.id)}
          onKeyDown={(event) => moveWithKeyboard(event, index)}
        >
          <span className="mobile-tab__icon">
            {completed.has(topic.id) ? (
              <Check size={16} strokeWidth={2.4} />
            ) : (
              <TopicIcon name={topic.icon} size={17} />
            )}
          </span>
          {topic.navTitle}
        </button>
      ))}
    </div>
  )
}
