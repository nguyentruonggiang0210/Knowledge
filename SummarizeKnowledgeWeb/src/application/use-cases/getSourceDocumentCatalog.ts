import type { SourceDocumentRepository } from '../ports/SourceDocumentRepository'

export function getSourceDocumentCatalog(repository: SourceDocumentRepository) {
  return repository.getCoverage()
}
