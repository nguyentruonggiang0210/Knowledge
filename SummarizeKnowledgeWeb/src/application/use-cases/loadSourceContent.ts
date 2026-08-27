import type { SourceDocument } from '../../domain/knowledge/SourceDocument'
import type { SourceContentRepository } from '../ports/SourceContentRepository'

export type SourceContentLoader = (
  document: SourceDocument,
  signal?: AbortSignal,
) => Promise<string>

export function createSourceContentLoader(
  repository: SourceContentRepository,
): SourceContentLoader {
  return (document, signal) => repository.read(document.assetPath, signal)
}
