import type { SourceDocumentRepository } from '../../application/ports/SourceDocumentRepository'
import type {
  SourceCoverage,
  SourceDocument,
} from '../../domain/knowledge/SourceDocument'
import generatedCatalog from '../../content/generated/sourceCatalog.json'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readString(value: unknown, field: string) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Source catalog: "${field}" phải là chuỗi không trống.`)
  }
  return value
}

function readNumber(value: unknown, field: string) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new Error(`Source catalog: "${field}" phải là số không âm.`)
  }
  return value
}

function readBoolean(value: unknown, field: string) {
  if (typeof value !== 'boolean') {
    throw new Error(`Source catalog: "${field}" phải là boolean.`)
  }
  return value
}

function readStringArray(value: unknown, field: string) {
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.some((entry) => typeof entry !== 'string' || entry.trim() === '')
  ) {
    throw new Error(`Source catalog: "${field}" phải là mảng chuỗi không trống.`)
  }
  return value as string[]
}

function parseDocument(value: unknown): SourceDocument {
  if (!isRecord(value)) throw new Error('Source catalog chứa document không hợp lệ.')
  return {
    id: readString(value.id, 'id'),
    topicId: readString(value.topicId, 'topicId'),
    title: readString(value.title, 'title'),
    sourcePaths: readStringArray(value.sourcePaths, 'sourcePaths'),
    assetPath: readString(value.assetPath, 'assetPath'),
    wordCount: readNumber(value.wordCount, 'wordCount'),
    lineCount: readNumber(value.lineCount, 'lineCount'),
    isAggregate: readBoolean(value.isAggregate, 'isAggregate'),
  }
}

function parseCoverage(value: unknown): SourceCoverage {
  if (!isRecord(value) || !Array.isArray(value.documents)) {
    throw new Error('Source catalog chưa được tạo đúng schema. Chạy npm run sync:sources.')
  }

  const documents = value.documents.map(parseDocument)
  const ids = new Set(documents.map((document) => document.id))
  if (ids.size !== documents.length) throw new Error('Source catalog có document id bị trùng.')

  return {
    totalSourceFiles: readNumber(value.totalSourceFiles, 'totalSourceFiles'),
    totalUniqueDocuments: readNumber(
      value.totalUniqueDocuments,
      'totalUniqueDocuments',
    ),
    totalWords: readNumber(value.totalWords, 'totalWords'),
    totalRawWords: readNumber(value.totalRawWords, 'totalRawWords'),
    documents,
  }
}

const coverage = parseCoverage(generatedCatalog)

export const generatedSourceDocumentRepository: SourceDocumentRepository = {
  getCoverage: () => coverage,
}
