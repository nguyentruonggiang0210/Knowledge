import { ArrowRight, Check, RotateCcw, Trophy, X } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import type { QuizQuestion } from '../../domain/knowledge/QuizQuestion'
import { useI18n } from '../i18n/I18nProvider'

interface QuizPanelProps {
  readonly topicId: string
  readonly questions: readonly QuizQuestion[]
}

interface QuizStats {
  readonly attempts: number
  readonly bestPercent: number
}

function questionBankVersion(questions: readonly QuizQuestion[]) {
  const serialized = JSON.stringify(
    questions.map((question) => [
      question.id,
      question.question,
      question.options,
      question.answerIndex,
      question.explanation,
      question.difficulty,
      question.source,
    ]),
  )
  let hash = 0x811c9dc5
  for (let index = 0; index < serialized.length; index += 1) {
    hash ^= serialized.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return `v1-${(hash >>> 0).toString(36)}`
}

function statsStorageKey(topicId: string, bankVersion: string) {
  return `knowledge-atlas.quiz.${topicId}.${bankVersion}`
}

function shuffled<T>(values: readonly T[]) {
  const result = [...values]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[result[index], result[swapIndex]] = [result[swapIndex], result[index]]
  }
  return result
}

function readStats(topicId: string, bankVersion: string): QuizStats {
  try {
    const value = localStorage.getItem(statsStorageKey(topicId, bankVersion))
    if (!value) return { attempts: 0, bestPercent: 0 }
    const parsed = JSON.parse(value) as Partial<QuizStats>
    return {
      attempts: Number.isFinite(parsed.attempts) ? Number(parsed.attempts) : 0,
      bestPercent: Number.isFinite(parsed.bestPercent)
        ? Number(parsed.bestPercent)
        : 0,
    }
  } catch {
    return { attempts: 0, bestPercent: 0 }
  }
}

function saveStats(topicId: string, bankVersion: string, stats: QuizStats) {
  try {
    localStorage.setItem(
      statsStorageKey(topicId, bankVersion),
      JSON.stringify(stats),
    )
  } catch {
    // Quiz vẫn hoạt động nếu trình duyệt chặn localStorage.
  }
}

export function QuizPanel({ topicId, questions }: QuizPanelProps) {
  const { t } = useI18n()
  const questionHeadingRef = useRef<HTMLLegendElement>(null)
  const resultHeadingRef = useRef<HTMLHeadingElement>(null)
  const bankVersion = useMemo(() => questionBankVersion(questions), [questions])
  const [session, setSession] = useState(() => shuffled(questions))
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [finished, setFinished] = useState(false)
  const [reviewSession, setReviewSession] = useState(false)
  const [stats, setStats] = useState(() => readStats(topicId, bankVersion))

  const currentQuestion = session[currentIndex]
  const selectedIndex = currentQuestion
    ? answers[currentQuestion.id]
    : undefined
  const answered = selectedIndex !== undefined
  const correctCount = session.filter(
    (question) => answers[question.id] === question.answerIndex,
  ).length
  const percent = session.length
    ? Math.round((correctCount / session.length) * 100)
    : 0

  const chooseAnswer = (optionIndex: number) => {
    if (!currentQuestion || answered) return
    setAnswers((current) => ({
      ...current,
      [currentQuestion.id]: optionIndex,
    }))
  }

  const finish = () => {
    const nextStats = {
      attempts: stats.attempts + (reviewSession ? 0 : 1),
      bestPercent: reviewSession
        ? stats.bestPercent
        : Math.max(stats.bestPercent, percent),
    }
    setStats(nextStats)
    saveStats(topicId, bankVersion, nextStats)
    setFinished(true)
    window.requestAnimationFrame(() => resultHeadingRef.current?.focus())
  }

  const goNext = () => {
    if (!answered) return
    if (currentIndex === session.length - 1) finish()
    else {
      setCurrentIndex((index) => index + 1)
      window.requestAnimationFrame(() => questionHeadingRef.current?.focus())
    }
  }

  const restart = (onlyIncorrect = false) => {
    const nextQuestions = onlyIncorrect
      ? session.filter((question) => answers[question.id] !== question.answerIndex)
      : questions
    setSession(shuffled(nextQuestions.length ? nextQuestions : questions))
    setCurrentIndex(0)
    setAnswers({})
    setFinished(false)
    setReviewSession(onlyIncorrect)
    window.requestAnimationFrame(() => questionHeadingRef.current?.focus())
  }

  if (questions.length === 0 || !currentQuestion) {
    return (
      <section className="quiz-panel quiz-panel--empty">
        <h2>{t('quiz.emptyTitle')}</h2>
        <p>{t('quiz.emptyBody')}</p>
      </section>
    )
  }

  if (finished) {
    const incorrect = session.filter(
      (question) => answers[question.id] !== question.answerIndex,
    )
    return (
      <section className="quiz-panel quiz-results" aria-labelledby="quiz-result-title">
        <div className="quiz-results__hero">
          <Trophy size={36} aria-hidden="true" />
          <span>
            {reviewSession ? t('quiz.reviewComplete') : t('quiz.complete')}
          </span>
          <h2 ref={resultHeadingRef} id="quiz-result-title" tabIndex={-1}>
            {percent}%
          </h2>
          <p>
            {t('quiz.score', {
              correct: correctCount,
              total: session.length,
              best: stats.bestPercent,
              attempts: stats.attempts,
            })}
          </p>
          <div className="quiz-results__actions">
            <button type="button" onClick={() => restart(false)}>
              <RotateCcw size={16} /> {t('quiz.restart')}
            </button>
            {incorrect.length > 0 && (
              <button type="button" onClick={() => restart(true)}>
                {t('quiz.reviewIncorrect', { count: incorrect.length })}{' '}
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>

        {incorrect.length > 0 && (
          <div className="quiz-review">
            <h3>{t('quiz.reviewTitle')}</h3>
            {incorrect.map((question) => (
              <article key={question.id}>
                <strong>{question.question}</strong>
                <p>{question.explanation}</p>
                <code>{question.source}</code>
              </article>
            ))}
          </div>
        )}
      </section>
    )
  }

  return (
    <section className="quiz-panel" aria-labelledby="quiz-question-title">
      <header className="quiz-progress">
        <div>
          <span>
            {t('quiz.question', {
              current: currentIndex + 1,
              total: session.length,
            })}
          </span>
          <strong>{t(`difficulty.${currentQuestion.difficulty}`)}</strong>
        </div>
        <div
          className="quiz-progress__track"
          role="progressbar"
          aria-label={t('quiz.progress')}
          aria-valuemin={0}
          aria-valuemax={session.length}
          aria-valuenow={currentIndex + (answered ? 1 : 0)}
        >
          <span
            style={{
              width: `${((currentIndex + (answered ? 1 : 0)) / session.length) * 100}%`,
            }}
          />
        </div>
      </header>

      <fieldset className="quiz-question">
        <legend
          ref={questionHeadingRef}
          id="quiz-question-title"
          tabIndex={-1}
        >
          {currentQuestion.question}
        </legend>
        <div className="quiz-options">
          {currentQuestion.options.map((option, optionIndex) => {
            const isSelected = selectedIndex === optionIndex
            const isCorrect = currentQuestion.answerIndex === optionIndex
            const state = answered
              ? isCorrect
                ? 'correct'
                : isSelected
                  ? 'wrong'
                  : 'idle'
              : 'idle'
            return (
              <label key={option} data-state={state}>
                <input
                  type="radio"
                  name={currentQuestion.id}
                  checked={isSelected}
                  disabled={answered}
                  onChange={() => chooseAnswer(optionIndex)}
                />
                <span className="quiz-option__letter">
                  {String.fromCharCode(65 + optionIndex)}
                </span>
                <span>{option}</span>
                {answered && isCorrect && (
                  <Check size={18} aria-label={t('quiz.correctAnswer')} />
                )}
                {answered && isSelected && !isCorrect && (
                  <X size={18} aria-label={t('quiz.wrongAnswer')} />
                )}
              </label>
            )
          })}
        </div>
      </fieldset>

      {answered && (
        <div
          className="quiz-explanation"
          data-correct={selectedIndex === currentQuestion.answerIndex}
          role="status"
        >
          <strong>
            {selectedIndex === currentQuestion.answerIndex
              ? t('quiz.correct')
              : t('quiz.incorrect')}
          </strong>
          <p>{currentQuestion.explanation}</p>
          <code>{t('quiz.source', { source: currentQuestion.source })}</code>
        </div>
      )}

      <footer className="quiz-panel__footer">
        <span>
          {t('quiz.currentScore', {
            correct: correctCount,
            answered: Object.keys(answers).length,
          })}
        </span>
        <button type="button" disabled={!answered} onClick={goNext}>
          {currentIndex === session.length - 1
            ? t('quiz.showResults')
            : t('quiz.next')}
          <ArrowRight size={16} />
        </button>
      </footer>
    </section>
  )
}
