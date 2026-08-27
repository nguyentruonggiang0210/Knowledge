import type { KnowledgeTopic } from '../../domain/knowledge/KnowledgeTopic'

export interface KnowledgeRepository {
  getAll(): readonly KnowledgeTopic[]
}
