import { describe, expect, it } from 'vitest'
import type { KnowledgeTopic } from '../../domain/knowledge/KnowledgeTopic'
import { searchKnowledgeCatalog } from './searchKnowledgeCatalog'

const topics: KnowledgeTopic[] = [
  {
    id: 'rag',
    title: 'RAG & Agent Systems',
    navTitle: 'RAG & Agents',
    eyebrow: 'Retrieval',
    description: 'Tìm kiếm lai và agent loop.',
    order: 1,
    icon: 'bot',
    accent: 'violet',
    level: 'Nâng cao',
    estimatedMinutes: 10,
    tags: ['retrieval', 'vector search'],
    sourceFolders: ['RAG'],
    outcomes: ['Hiểu hybrid retrieval'],
    contentFolder: 'rag',
    content: '## Hybrid retrieval\n\nKết hợp sparse, dense và đo độ phức tạp.',
    questions: [],
  },
  {
    id: 'database',
    title: 'Advanced Databases',
    navTitle: 'Databases',
    eyebrow: 'PostgreSQL',
    description: 'MVCC và index.',
    order: 2,
    icon: 'database',
    accent: 'mint',
    level: 'Nâng cao',
    estimatedMinutes: 10,
    tags: ['SQL'],
    sourceFolders: ['DatabaseAdvance'],
    outcomes: ['Đọc query plan'],
    contentFolder: 'database',
    content: '## MVCC\n\nIsolation và lock.',
    questions: [],
  },
]

describe('searchKnowledgeCatalog', () => {
  it('tìm không dấu trong tiêu đề và nội dung', () => {
    expect(searchKnowledgeCatalog(topics, 'tim kiem lai')[0]?.topic.id).toBe('rag')
    expect(searchKnowledgeCatalog(topics, 'do phuc tap')[0]?.topic.id).toBe('rag')
  })

  it('ưu tiên kết quả khớp tiêu đề hoặc tag', () => {
    expect(searchKnowledgeCatalog(topics, 'retrieval')[0]?.score).toBeGreaterThan(1)
  })

  it('yêu cầu mọi từ khóa cùng khớp và trả rỗng nếu không có', () => {
    expect(searchKnowledgeCatalog(topics, 'RAG MVCC')).toHaveLength(0)
    expect(searchKnowledgeCatalog(topics, '   ')).toEqual([])
  })
})
