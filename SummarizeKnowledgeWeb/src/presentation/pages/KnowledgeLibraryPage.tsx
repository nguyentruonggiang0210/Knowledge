import { useState } from 'react'
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
  const explorer = useKnowledgeExplorer(topics)
  const progress = useLearningProgress(topics.map((topic) => topic.id))
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
        <h1>Chưa có chủ đề kiến thức</h1>
        <p>Hãy thêm một folder vào src/content/knowledge để bắt đầu.</p>
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
        topics={topics}
        activeTopicId={topic.id}
        completed={progress.completed}
        onSelect={explorer.selectTopic}
      />

      <div className="library-layout">
        <TopicNavigation
          topics={topics}
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
              total={topics.length}
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
              previous={topics[explorer.activeIndex - 1]}
              next={topics[explorer.activeIndex + 1]}
              onPrevious={explorer.selectPrevious}
              onNext={explorer.selectNext}
            />
            <footer className="site-footer">
              <span>Knowledge Atlas</span>
              <span>
                Đã phân loại {sourceCoverage.totalSourceFiles} file Markdown ·{' '}
                {sourceCoverage.totalWords.toLocaleString('vi-VN')} từ sau khử bản
                tổng hợp.
              </span>
            </footer>
          </section>
        </main>
      </div>
    </div>
  )
}
