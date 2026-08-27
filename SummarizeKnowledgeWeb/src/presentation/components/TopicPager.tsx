import { ArrowLeft, ArrowRight } from 'lucide-react'
import type { KnowledgeTopic } from '../../domain/knowledge/KnowledgeTopic'

interface TopicPagerProps {
  readonly previous?: KnowledgeTopic
  readonly next?: KnowledgeTopic
  readonly onPrevious: () => void
  readonly onNext: () => void
}

export function TopicPager({
  previous,
  next,
  onPrevious,
  onNext,
}: TopicPagerProps) {
  return (
    <nav className="topic-pager" aria-label="Chuyển chủ đề">
      {previous ? (
        <button type="button" onClick={onPrevious}>
          <ArrowLeft size={18} />
          <span>
            <small>Chủ đề trước</small>
            <strong>{previous.navTitle}</strong>
          </span>
        </button>
      ) : (
        <span />
      )}
      {next && (
        <button type="button" onClick={onNext} className="topic-pager__next">
          <span>
            <small>Tiếp theo</small>
            <strong>{next.navTitle}</strong>
          </span>
          <ArrowRight size={18} />
        </button>
      )}
    </nav>
  )
}
