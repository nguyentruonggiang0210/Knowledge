import type { SourceCoverage } from '../../domain/knowledge/SourceDocument'

export interface SourceDocumentRepository {
  getCoverage(): SourceCoverage
}
