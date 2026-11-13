import { ArrowLeft, ArrowRight } from 'lucide-react'
import type { KnowledgeTopic } from '../../domain/knowledge/KnowledgeTopic'
import { useI18n } from '../i18n/I18nProvider'

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
  const { t } = useI18n()

  return (
    <nav className="topic-pager" aria-label={t('pager.label')}>
      {previous ? (
        <button type="button" onClick={onPrevious}>
          <ArrowLeft size={18} />
          <span>
            <small>{t('pager.previous')}</small>
            <strong>{previous.navTitle}</strong>
          </span>
        </button>
      ) : (
        <span />
      )}
      {next && (
        <button type="button" onClick={onNext} className="topic-pager__next">
          <span>
            <small>{t('pager.next')}</small>
            <strong>{next.navTitle}</strong>
          </span>
          <ArrowRight size={18} />
        </button>
      )}
    </nav>
  )
}
