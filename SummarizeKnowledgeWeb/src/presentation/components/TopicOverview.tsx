import { ArrowUpRight, Target } from 'lucide-react'
import type { KnowledgeTopic } from '../../domain/knowledge/KnowledgeTopic'

interface TopicOverviewProps {
  readonly topic: KnowledgeTopic
}

export function TopicOverview({ topic }: TopicOverviewProps) {
  return (
    <section className="topic-overview" aria-label="Mục tiêu và nguồn kiến thức">
      <div className="outcomes-card">
        <div className="section-title">
          <span className="section-title__icon">
            <Target size={18} />
          </span>
          <div>
            <small>Sau tab này</small>
            <h2>Bạn sẽ nắm được</h2>
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
            <small>Đã khử trùng lặp</small>
            <h2>Nguồn được hợp nhất</h2>
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
