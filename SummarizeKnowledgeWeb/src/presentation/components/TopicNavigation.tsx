import { Check, LibraryBig } from 'lucide-react'
import type { KeyboardEvent } from 'react'
import type { KnowledgeTopic } from '../../domain/knowledge/KnowledgeTopic'
import { useI18n } from '../i18n/I18nProvider'
import { TopicIcon } from './TopicIcon'

interface TopicNavigationProps {
  readonly topics: readonly KnowledgeTopic[]
  readonly activeTopicId: string
  readonly completed: ReadonlySet<string>
  readonly completedCount: number
  readonly completionPercent: number
  readonly onSelect: (topicId: string) => void
}

export function TopicNavigation({
  topics,
  activeTopicId,
  completed,
  completedCount,
  completionPercent,
  onSelect,
}: TopicNavigationProps) {
  const { t } = useI18n()

  const moveWithKeyboard = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | undefined
    if (event.key === 'ArrowDown') nextIndex = (index + 1) % topics.length
    if (event.key === 'ArrowUp') nextIndex = (index - 1 + topics.length) % topics.length
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = topics.length - 1
    if (nextIndex === undefined) return

    event.preventDefault()
    const nextTopic = topics[nextIndex]
    onSelect(nextTopic.id)
    window.requestAnimationFrame(() =>
      document.getElementById(`tab-${nextTopic.id}`)?.focus(),
    )
  }

  return (
    <aside className="topic-sidebar" aria-label={t('navigation.label')}>
      <div className="progress-card">
        <div className="progress-card__topline">
          <span>
            <LibraryBig size={16} aria-hidden="true" /> {t('navigation.journey')}
          </span>
          <strong>{completionPercent}%</strong>
        </div>
        <div
          className="progress-track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={completionPercent}
          aria-label={t('navigation.progress')}
        >
          <span style={{ width: `${completionPercent}%` }} />
        </div>
        <small>
          {t('navigation.completed', {
            completed: completedCount,
            total: topics.length,
          })}
        </small>
      </div>

      <div className="topic-sidebar__label">{t('navigation.library')}</div>
      <nav className="topic-list" role="tablist" aria-orientation="vertical">
        {topics.map((topic, index) => {
          const isActive = topic.id === activeTopicId
          const isCompleted = completed.has(topic.id)
          return (
            <button
              key={topic.id}
              id={`tab-${topic.id}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls="knowledge-panel"
              tabIndex={isActive ? 0 : -1}
              className="topic-tab"
              data-active={isActive}
              data-accent={topic.accent}
              onClick={() => onSelect(topic.id)}
              onKeyDown={(event) => moveWithKeyboard(event, index)}
            >
              <span className="topic-tab__number">
                {isCompleted ? <Check size={13} strokeWidth={2.5} /> : index + 1}
              </span>
              <span className="topic-tab__icon">
                <TopicIcon name={topic.icon} size={19} />
              </span>
              <span className="topic-tab__copy">
                <strong>{topic.navTitle}</strong>
                <small>{t('topic.minutes', { minutes: topic.estimatedMinutes })}</small>
              </span>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
