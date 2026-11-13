import { Check, CheckCircle2, Clock3, FolderTree } from 'lucide-react'
import type { KnowledgeTopic } from '../../domain/knowledge/KnowledgeTopic'
import { useI18n } from '../i18n/I18nProvider'
import { TopicIcon } from './TopicIcon'

interface KnowledgeHeroProps {
  readonly topic: KnowledgeTopic
  readonly isCompleted: boolean
  readonly position: number
  readonly total: number
  readonly onToggleCompleted: () => void
}

export function KnowledgeHero({
  topic,
  isCompleted,
  position,
  total,
  onToggleCompleted,
}: KnowledgeHeroProps) {
  const { t } = useI18n()

  return (
    <section className="knowledge-hero" data-accent={topic.accent}>
      <div className="knowledge-hero__orb knowledge-hero__orb--one" />
      <div className="knowledge-hero__orb knowledge-hero__orb--two" />

      <div className="knowledge-hero__topline">
        <span className="topic-kicker">
          {t('topic.position', {
            position: String(position).padStart(2, '0'),
            total: String(total).padStart(2, '0'),
          })}
        </span>
        <span className="level-badge">{t(`level.${topic.level}`)}</span>
      </div>

      <div className="knowledge-hero__body">
        <span className="knowledge-hero__icon">
          <TopicIcon name={topic.icon} size={31} strokeWidth={1.6} />
        </span>
        <div>
          <p className="eyebrow">{topic.eyebrow}</p>
          <h1>{topic.title}</h1>
          <p className="knowledge-hero__description">{topic.description}</p>
        </div>
      </div>

      <div className="knowledge-hero__meta">
        <span>
          <Clock3 size={16} aria-hidden="true" />{' '}
          {t('topic.minutes', { minutes: topic.estimatedMinutes })}
        </span>
        <span>
          <FolderTree size={16} aria-hidden="true" />{' '}
          {t('topic.sources', { count: topic.sourceFolders.length })}
        </span>
        <button
          type="button"
          className="complete-button"
          data-complete={isCompleted}
          onClick={onToggleCompleted}
        >
          {isCompleted ? (
            <>
              <CheckCircle2 size={17} /> {t('topic.completed')}
            </>
          ) : (
            <>
              <Check size={17} /> {t('topic.markComplete')}
            </>
          )}
        </button>
      </div>
    </section>
  )
}
