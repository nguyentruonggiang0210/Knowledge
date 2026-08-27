export const QUIZ_DIFFICULTIES = ['Cơ bản', 'Trung cấp', 'Nâng cao'] as const

export type QuizDifficulty = (typeof QUIZ_DIFFICULTIES)[number]

export interface QuizQuestion {
  readonly id: string
  readonly question: string
  readonly options: readonly [string, string, string, string]
  readonly answerIndex: number
  readonly explanation: string
  readonly difficulty: QuizDifficulty
  readonly source: string
}
