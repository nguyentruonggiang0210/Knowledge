import { describe, expect, it } from 'vitest'
import { generatedSourceDocumentRepository } from './generatedSourceDocumentRepository'

describe('generatedSourceDocumentRepository', () => {
  const coverage = generatedSourceDocumentRepository.getCoverage()

  it('bao phủ toàn bộ Markdown nguồn mà không gán lặp', () => {
    const sourcePaths = coverage.documents.flatMap(
      (document) => document.sourcePaths,
    )
    expect(coverage.totalSourceFiles).toBeGreaterThanOrEqual(376)
    expect(sourcePaths).toHaveLength(coverage.totalSourceFiles)
    expect(new Set(sourcePaths).size).toBe(sourcePaths.length)
  })

  it('giữ tài liệu theo đủ 12 canonical topic và không nhét Markdown vào JS', () => {
    expect(new Set(coverage.documents.map((document) => document.topicId)).size).toBe(12)
    expect(coverage.totalWords).toBeGreaterThan(600_000)
    expect(
      coverage.documents.every(
        (document) =>
          document.assetPath.endsWith('.md') && document.wordCount > 0,
      ),
    ).toBe(true)
  })

  it('giữ bản aggregate để đọc nhưng không cộng trùng vào thống kê kiến thức', () => {
    const aggregateDocuments = coverage.documents.filter(
      (document) => document.isAggregate,
    )
    const calculatedRawWords = coverage.documents.reduce(
      (sum, document) => sum + document.wordCount,
      0,
    )
    const calculatedLearningWords = coverage.documents.reduce(
      (sum, document) => sum + (document.isAggregate ? 0 : document.wordCount),
      0,
    )

    expect(aggregateDocuments.map((document) => document.sourcePaths[0])).toContain(
      'ClaudeArchitectFoundation/Tool2/Output/ALL_DOMAINS.md',
    )
    expect(coverage.totalRawWords).toBe(calculatedRawWords)
    expect(coverage.totalWords).toBe(calculatedLearningWords)
    expect(coverage.totalRawWords).toBeGreaterThan(coverage.totalWords)
  })
})
