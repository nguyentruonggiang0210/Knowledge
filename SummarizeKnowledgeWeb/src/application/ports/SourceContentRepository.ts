export interface SourceContentRepository {
  read(assetPath: string, signal?: AbortSignal): Promise<string>
}
