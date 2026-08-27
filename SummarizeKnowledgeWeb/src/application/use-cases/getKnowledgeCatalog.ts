import type { KnowledgeRepository } from '../ports/KnowledgeRepository'

export function getKnowledgeCatalog(repository: KnowledgeRepository) {
  return repository.getAll()
}
