import { ArrowUpRight, Target } from 'lucide-react'
import type { KnowledgeTopic } from '../../domain/knowledge/KnowledgeTopic'
import { useI18n } from '../i18n/I18nProvider'

interface TopicOverviewProps {
  readonly topic: KnowledgeTopic
}

export function TopicOverview({ topic }: TopicOverviewProps) {
  const { t } = useI18n()

  return (
    <section className="topic-overview" aria-label={t('overview.label')}>
      <div className="outcomes-card">
        <div className="section-title">
          <span className="section-title__icon">
            <Target size={18} />
          </span>
          <div>
            <small>{t('overview.after')}</small>
            <h2>{t('overview.outcomes')}</h2>
          </div>
        </div>
        <ul className="outcomes-list">
          {topic.outcomes.map((outcome) => (
            <li key={outcome}>{outcome}</li>
          ))}
        </ul>
      </div>

      <div className="sources-card">
        <div className="section-title">
          <span className="section-title__icon">
            <ArrowUpRight size={18} />
          </span>
          <div>
            <small>{t('overview.deduplicated')}</small>
            <h2>{t('overview.sources')}</h2>
          </div>
        </div>
        <div className="source-chips">
          {topic.sourceFolders.map((source) => (
            <code key={source}>{source}</code>
          ))}
        </div>
      </div>
    </section>
  )
}
