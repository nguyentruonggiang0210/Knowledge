export const KNOWLEDGE_LEVELS = [
  'Nền tảng',
  'Trung cấp',
  'Nâng cao',
  'Thực chiến',
] as const

export const KNOWLEDGE_ACCENTS = [
  'lime',
  'sky',
  'violet',
  'coral',
  'amber',
  'mint',
] as const

export type KnowledgeLevel = (typeof KNOWLEDGE_LEVELS)[number]
export type KnowledgeAccent = (typeof KNOWLEDGE_ACCENTS)[number]

export interface KnowledgeMetadata {
  readonly id: string
  readonly title: string
  readonly navTitle: string
  readonly eyebrow: string
  readonly description: string
  readonly order: number
  readonly icon: string
  readonly accent: KnowledgeAccent
  readonly level: KnowledgeLevel
  readonly estimatedMinutes: number
  readonly tags: readonly string[]
  readonly sourceFolders: readonly string[]
  readonly outcomes: readonly string[]
}

export interface KnowledgeTopic extends KnowledgeMetadata {
  readonly content: string
  readonly contentFolder: string
  readonly questions: readonly QuizQuestion[]
}

export interface KnowledgeSearchResult {
  readonly topic: KnowledgeTopic
  readonly score: number
  readonly excerpt: string
  readonly matches: readonly string[]
}
import type { QuizQuestion } from './QuizQuestion'
