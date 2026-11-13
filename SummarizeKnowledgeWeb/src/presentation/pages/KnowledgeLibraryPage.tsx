import { useMemo, useState } from 'react'
import type { SourceContentLoader } from '../../application/use-cases/loadSourceContent'
import type { KnowledgeTopic } from '../../domain/knowledge/KnowledgeTopic'
import type { SourceCoverage } from '../../domain/knowledge/SourceDocument'
import { AppHeader } from '../components/AppHeader'
import { KnowledgeArticle } from '../components/KnowledgeArticle'
import { KnowledgeHero } from '../components/KnowledgeHero'
import {
  LearningModeTabs,
  type LearningMode,
} from '../components/LearningModeTabs'
import { MobileTopicTabs } from '../components/MobileTopicTabs'
import { QuizPanel } from '../components/QuizPanel'
import { SourceLibrary } from '../components/SourceLibrary'
import { TopicNavigation } from '../components/TopicNavigation'
import { TopicOverview } from '../components/TopicOverview'
import { TopicPager } from '../components/TopicPager'
import { useKnowledgeExplorer } from '../hooks/useKnowledgeExplorer'
import { useLearningProgress } from '../hooks/useLearningProgress'
import { useTheme } from '../hooks/useTheme'
import { useI18n } from '../i18n/I18nProvider'
import { localizeTopics } from '../i18n/topicTranslations'

interface KnowledgeLibraryPageProps {
  readonly topics: readonly KnowledgeTopic[]
  readonly sourceCoverage: SourceCoverage
  readonly loadSourceContent: SourceContentLoader
}

export function KnowledgeLibraryPage({
  topics,
  sourceCoverage,
  loadSourceContent,
}: KnowledgeLibraryPageProps) {
  const { formatNumber, locale, t } = useI18n()
  const localizedTopics = useMemo(
    () => localizeTopics(topics, locale),
    [locale, topics],
  )
  const explorer = useKnowledgeExplorer(localizedTopics)
  const progress = useLearningProgress(localizedTopics.map((topic) => topic.id))
  const { theme, toggleTheme } = useTheme()
  const [learningMode, setLearningMode] = useState<LearningMode>('summary')
  const [visitedLearningModes, setVisitedLearningModes] = useState<
    ReadonlySet<LearningMode>
  >(() => new Set<LearningMode>(['summary']))

  const selectLearningMode = (mode: LearningMode) => {
    setVisitedLearningModes((current) => {
      if (current.has(mode)) return current
      return new Set<LearningMode>([...current, mode])
    })
    setLearningMode(mode)
  }

  if (!explorer.activeTopic) {
    return (
      <main className="catalog-empty">
        <h1>{t('catalog.emptyTitle')}</h1>
        <p>{t('catalog.emptyBody')}</p>
      </main>
    )
  }

  const topic = explorer.activeTopic
  const topicSources = sourceCoverage.documents.filter(
    (document) => document.topicId === topic.id,
  )
  const topicSourceFileCount = topicSources.reduce(
    (sum, document) => sum + document.sourcePaths.length,
    0,
  )

  return (
    <div className="app-shell" id="top">
      <AppHeader
        query={explorer.query}
        results={explorer.searchResults}
        theme={theme}
        onQueryChange={explorer.setQuery}
        onSelectTopic={explorer.selectTopic}
        onToggleTheme={toggleTheme}
      />

      <MobileTopicTabs
        topics={localizedTopics}
        activeTopicId={topic.id}
        completed={progress.completed}
        onSelect={explorer.selectTopic}
      />

      <div className="library-layout">
        <TopicNavigation
          topics={localizedTopics}
          activeTopicId={topic.id}
          completed={progress.completed}
          completedCount={progress.completedCount}
          completionPercent={progress.completionPercent}
          onSelect={explorer.selectTopic}
        />

        <main className="knowledge-main">
          <section id="knowledge-panel" role="tabpanel" aria-label={topic.title}>
            <KnowledgeHero
              topic={topic}
              position={explorer.activeIndex + 1}
              total={localizedTopics.length}
              isCompleted={progress.completed.has(topic.id)}
              onToggleCompleted={() => progress.toggleCompleted(topic.id)}
            />
            <TopicOverview topic={topic} />
            <LearningModeTabs
              activeMode={learningMode}
              sourceCount={topicSourceFileCount}
              questionCount={topic.questions.length}
              onChange={selectLearningMode}
            />
            {locale === 'en' && (
              <p className="content-language-note" role="note">
                {t('content.originalLanguage')}
              </p>
            )}
            <div
              id="learning-mode-panel-summary"
              className="learning-mode-panel"
              role="tabpanel"
              aria-labelledby="learning-mode-tab-summary"
              hidden={learningMode !== 'summary'}
            >
              {visitedLearningModes.has('summary') && (
                <KnowledgeArticle topic={topic} />
              )}
            </div>
            <div
              id="learning-mode-panel-sources"
              className="learning-mode-panel"
              role="tabpanel"
              aria-labelledby="learning-mode-tab-sources"
              hidden={learningMode !== 'sources'}
            >
              {visitedLearningModes.has('sources') && (
                <SourceLibrary
                  key={topic.id}
                  documents={topicSources}
                  totalWorkspaceFiles={sourceCoverage.totalSourceFiles}
                  loadSourceContent={loadSourceContent}
                />
              )}
            </div>
            <div
              id="learning-mode-panel-quiz"
              className="learning-mode-panel"
              role="tabpanel"
              aria-labelledby="learning-mode-tab-quiz"
              hidden={learningMode !== 'quiz'}
            >
              {visitedLearningModes.has('quiz') && (
                <QuizPanel
                  key={topic.id}
                  topicId={topic.id}
                  questions={topic.questions}
                />
              )}
            </div>
            <TopicPager
              previous={localizedTopics[explorer.activeIndex - 1]}
              next={localizedTopics[explorer.activeIndex + 1]}
              onPrevious={explorer.selectPrevious}
              onNext={explorer.selectNext}
            />
            <footer className="site-footer">
              <span>Knowledge Atlas</span>
              <span>
                {t('footer.coverage', {
                  files: formatNumber(sourceCoverage.totalSourceFiles),
                  words: formatNumber(sourceCoverage.totalWords),
                })}
              </span>
            </footer>
          </section>
        </main>
      </div>
    </div>
  )
}
