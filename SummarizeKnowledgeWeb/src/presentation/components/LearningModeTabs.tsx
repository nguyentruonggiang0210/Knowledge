import { BookOpenText, BrainCircuit, LibraryBig } from 'lucide-react'
import type { KeyboardEvent } from 'react'
import { useI18n } from '../i18n/I18nProvider'

export type LearningMode = 'summary' | 'sources' | 'quiz'

interface LearningModeTabsProps {
  readonly activeMode: LearningMode
  readonly sourceCount: number
  readonly questionCount: number
  readonly onChange: (mode: LearningMode) => void
}

const modes = [
  { id: 'summary', labelKey: 'mode.summary', icon: BookOpenText },
  { id: 'sources', labelKey: 'mode.sources', icon: LibraryBig },
  { id: 'quiz', labelKey: 'mode.quiz', icon: BrainCircuit },
] as const

export function LearningModeTabs({
  activeMode,
  sourceCount,
  questionCount,
  onChange,
}: LearningModeTabsProps) {
  const { t } = useI18n()

  const changeWithKeyboard = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    let nextIndex: number
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % modes.length
    else if (event.key === 'ArrowLeft') {
      nextIndex = (index - 1 + modes.length) % modes.length
    } else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = modes.length - 1
    else return

    event.preventDefault()
    const nextMode = modes[nextIndex].id
    onChange(nextMode)
    window.requestAnimationFrame(() => {
      document.getElementById(`learning-mode-tab-${nextMode}`)?.focus()
    })
  }

  return (
    <div className="learning-modes" role="tablist" aria-label={t('mode.label')}>
      {modes.map((mode, index) => {
        const Icon = mode.icon
        const count =
          mode.id === 'sources'
            ? sourceCount
            : mode.id === 'quiz'
              ? questionCount
              : undefined
        return (
          <button
            key={mode.id}
            id={`learning-mode-tab-${mode.id}`}
            type="button"
            role="tab"
            aria-selected={activeMode === mode.id}
            aria-controls={`learning-mode-panel-${mode.id}`}
            tabIndex={activeMode === mode.id ? 0 : -1}
            onClick={() => onChange(mode.id)}
            onKeyDown={(event) => changeWithKeyboard(event, index)}
          >
            <Icon size={17} aria-hidden="true" />
            <span>{t(mode.labelKey)}</span>
            {count !== undefined && <strong>{count}</strong>}
          </button>
        )
      })}
    </div>
  )
}
