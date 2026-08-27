import { describe, expect, it } from 'vitest'
import { fileKnowledgeRepository } from './fileKnowledgeRepository'

describe('fileKnowledgeRepository', () => {
  const topics = fileKnowledgeRepository.getAll()

  it('tự phát hiện toàn bộ thư mục kiến thức', () => {
    expect(topics.length).toBeGreaterThanOrEqual(12)
    expect(
      topics.every(
        (topic) =>
          (topic.content.match(/[\p{L}\p{N}]+/gu) ?? []).length >= 1_000,
      ),
    ).toBe(true)
  })

  it('giữ id duy nhất và sắp xếp theo order', () => {
    expect(new Set(topics.map((topic) => topic.id)).size).toBe(topics.length)
    expect(topics.map((topic) => topic.order)).toEqual(
      [...topics].sort((left, right) => left.order - right.order).map((topic) => topic.order),
    )
  })

  it('mỗi chủ đề giữ nguồn và mục tiêu học tập', () => {
    expect(
      topics.every(
        (topic) => topic.sourceFolders.length > 0 && topic.outcomes.length >= 3,
      ),
    ).toBe(true)
  })

  it('mỗi chủ đề có ngân hàng Q&A đủ lớn và đáp án hợp lệ', () => {
    expect(topics.every((topic) => topic.questions.length >= 15)).toBe(true)
    expect(
      topics.every((topic) =>
        topic.questions.every(
          (question) =>
            question.options.length === 4 &&
            Number.isInteger(question.answerIndex) &&
            question.answerIndex >= 0 &&
            question.answerIndex < 4,
        ),
      ),
    ).toBe(true)
  })
})
