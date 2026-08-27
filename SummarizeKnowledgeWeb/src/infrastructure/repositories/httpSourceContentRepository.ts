import type { SourceContentRepository } from '../../application/ports/SourceContentRepository'

const cache = new Map<string, string>()

function sourceAssetUrl(assetPath: string) {
  return `${import.meta.env.BASE_URL}${assetPath}`
}

export const httpSourceContentRepository: SourceContentRepository = {
  async read(assetPath, signal) {
    const url = sourceAssetUrl(assetPath)
    const cached = cache.get(url)
    if (cached !== undefined) return cached

    const response = await fetch(url, { signal })
    if (!response.ok) throw new Error(`Không thể tải ${assetPath}: HTTP ${response.status}`)
    const content = await response.text()
    cache.set(url, content)
    return content
  },
}
