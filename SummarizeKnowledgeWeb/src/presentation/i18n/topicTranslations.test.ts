import { describe, expect, it } from 'vitest'
import { fileKnowledgeRepository } from '../../infrastructure/repositories/fileKnowledgeRepository'
import { hasEnglishTopicTranslation, localizeTopics } from './topicTranslations'

describe('topic translations', () => {
  const topics = fileKnowledgeRepository.getAll()

  it('có metadata tiếng Anh cho mọi chủ đề', () => {
    expect(topics.every((topic) => hasEnglishTopicTranslation(topic.id))).toBe(true)
  })

  it('giữ id, source và nội dung kỹ thuật nguyên bản khi bản địa hóa', () => {
    const localized = localizeTopics(topics, 'en')

    expect(localized.map((topic) => topic.id)).toEqual(topics.map((topic) => topic.id))
    expect(localized.map((topic) => topic.sourceFolders)).toEqual(
      topics.map((topic) => topic.sourceFolders),
    )
    expect(localized.map((topic) => topic.content)).toEqual(
      topics.map((topic) => topic.content),
    )
    expect(localized.find((topic) => topic.id === 'docker-kubernetes')?.title).toBe(
      'Docker & Kubernetes Engineering',
    )
  })
})
