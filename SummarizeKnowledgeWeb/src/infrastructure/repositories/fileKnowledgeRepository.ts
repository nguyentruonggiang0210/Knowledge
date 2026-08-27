import type { KnowledgeRepository } from '../../application/ports/KnowledgeRepository'
import {
  KNOWLEDGE_ACCENTS,
  KNOWLEDGE_LEVELS,
  type KnowledgeAccent,
  type KnowledgeLevel,
  type KnowledgeMetadata,
  type KnowledgeTopic,
} from '../../domain/knowledge/KnowledgeTopic'
import {
  QUIZ_DIFFICULTIES,
  type QuizDifficulty,
  type QuizQuestion,
} from '../../domain/knowledge/QuizQuestion'

type JsonModule = { default: unknown }

const metadataModules = import.meta.glob<JsonModule>(
  '../../content/knowledge/*/meta.json',
  { eager: true },
)

const contentModules = import.meta.glob<string>(
  '../../content/knowledge/*/content.md',
  {
    eager: true,
    query: '?raw',
    import: 'default',
  },
)

const questionModules = import.meta.glob<JsonModule>(
  '../../content/knowledge/*/questions.json',
  { eager: true },
)

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readString(value: unknown, field: string, source: string) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Trường "${field}" không hợp lệ trong ${source}`)
  }
  return value.trim()
}

function readNumber(value: unknown, field: string, source: string) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new Error(`Trường "${field}" không hợp lệ trong ${source}`)
  }
  return value
}

function readStringArray(value: unknown, field: string, source: string) {
  if (
    !Array.isArray(value) ||
    value.some((entry) => typeof entry !== 'string' || entry.trim() === '')
  ) {
    throw new Error(`Trường "${field}" không hợp lệ trong ${source}`)
  }
  return value.map((entry) => entry.trim())
}

function readEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  field: string,
  source: string,
): T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    throw new Error(`Trường "${field}" không hợp lệ trong ${source}`)
  }
  return value as T
}

function parseMetadata(value: unknown, source: string): KnowledgeMetadata {
  if (!isRecord(value)) {
    throw new Error(`Metadata phải là một object trong ${source}`)
  }

  return {
    id: readString(value.id, 'id', source),
    title: readString(value.title, 'title', source),
    navTitle: readString(value.navTitle, 'navTitle', source),
    eyebrow: readString(value.eyebrow, 'eyebrow', source),
    description: readString(value.description, 'description', source),
    order: readNumber(value.order, 'order', source),
    icon: readString(value.icon, 'icon', source),
    accent: readEnum<KnowledgeAccent>(
      value.accent,
      KNOWLEDGE_ACCENTS,
      'accent',
      source,
    ),
    level: readEnum<KnowledgeLevel>(
      value.level,
      KNOWLEDGE_LEVELS,
      'level',
      source,
    ),
    estimatedMinutes: readNumber(
      value.estimatedMinutes,
      'estimatedMinutes',
      source,
    ),
    tags: readStringArray(value.tags, 'tags', source),
    sourceFolders: readStringArray(value.sourceFolders, 'sourceFolders', source),
    outcomes: readStringArray(value.outcomes, 'outcomes', source),
  }
}

function parseQuestion(value: unknown, source: string): QuizQuestion {
  if (!isRecord(value)) {
    throw new Error(`Câu hỏi phải là một object trong ${source}`)
  }

  const options = readStringArray(value.options, 'options', source)
  if (options.length !== 4) {
    throw new Error(`Câu hỏi trong ${source} phải có đúng 4 lựa chọn`)
  }
  const answerIndex = readNumber(value.answerIndex, 'answerIndex', source)
  if (!Number.isInteger(answerIndex) || answerIndex > 3) {
    throw new Error(`answerIndex trong ${source} phải là số nguyên từ 0 đến 3`)
  }

  return {
    id: readString(value.id, 'id', source),
    question: readString(value.question, 'question', source),
    options: options as [string, string, string, string],
    answerIndex,
    explanation: readString(value.explanation, 'explanation', source),
    difficulty: readEnum<QuizDifficulty>(
      value.difficulty,
      QUIZ_DIFFICULTIES,
      'difficulty',
      source,
    ),
    source: readString(value.source, 'source', source),
  }
}

function parseQuestions(value: unknown, source: string) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${source} phải là mảng câu hỏi không trống`)
  }
  const questions = value.map((question) => parseQuestion(question, source))
  const ids = new Set(questions.map((question) => question.id))
  if (ids.size !== questions.length) {
    throw new Error(`${source} có id câu hỏi bị trùng`)
  }
  return questions
}

function folderFromPath(path: string) {
  return path.split('/').at(-2) ?? ''
}

function loadTopics(): readonly KnowledgeTopic[] {
  const metadataFolders = new Set(Object.keys(metadataModules).map(folderFromPath))
  for (const contentPath of Object.keys(contentModules)) {
    const folder = folderFromPath(contentPath)
    if (!metadataFolders.has(folder)) {
      throw new Error(`Thiếu meta.json trong thư mục ${folder}`)
    }
  }
  for (const questionPath of Object.keys(questionModules)) {
    const folder = folderFromPath(questionPath)
    if (!metadataFolders.has(folder)) {
      throw new Error(`Thiếu meta.json trong thư mục ${folder}`)
    }
  }

  const topics = Object.entries(metadataModules).map(([metadataPath, module]) => {
    const folder = folderFromPath(metadataPath)
    const contentPath = metadataPath.replace(/meta\.json$/, 'content.md')
    const questionsPath = metadataPath.replace(/meta\.json$/, 'questions.json')
    const content = contentModules[contentPath]
    const questions = questionModules[questionsPath]

    if (typeof content !== 'string' || content.trim() === '') {
      throw new Error(`Thiếu content.md hoặc nội dung trống trong thư mục ${folder}`)
    }
    if (!questions) {
      throw new Error(`Thiếu questions.json trong thư mục ${folder}`)
    }

    return {
      ...parseMetadata(module.default, metadataPath),
      content,
      contentFolder: folder,
      questions: parseQuestions(questions.default, questionsPath),
    }
  })

  const ids = new Set<string>()
  for (const topic of topics) {
    if (ids.has(topic.id)) {
      throw new Error(`Trùng id chủ đề: ${topic.id}`)
    }
    ids.add(topic.id)
  }

  return topics.sort((left, right) => left.order - right.order)
}

const catalog = loadTopics()

export const fileKnowledgeRepository: KnowledgeRepository = {
  getAll: () => catalog,
}
