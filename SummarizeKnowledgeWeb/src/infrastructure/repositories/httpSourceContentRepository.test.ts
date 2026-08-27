import { describe, expect, it, vi } from 'vitest'
import { httpSourceContentRepository } from './httpSourceContentRepository'

describe('httpSourceContentRepository', () => {
  it('tải Markdown theo BASE_URL và cache lần đọc sau', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => '# Markdown nguồn',
    })
    vi.stubGlobal('fetch', fetchMock)
    const controller = new AbortController()
    const assetPath = 'knowledge-sources/test/cache-contract.md'

    await expect(
      httpSourceContentRepository.read(assetPath, controller.signal),
    ).resolves.toBe('# Markdown nguồn')
    await expect(httpSourceContentRepository.read(assetPath)).resolves.toBe(
      '# Markdown nguồn',
    )
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(`/${assetPath}`, {
      signal: controller.signal,
    })
  })

  it('báo lỗi rõ khi static asset không tồn tại', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }))
    await expect(
      httpSourceContentRepository.read(
        'knowledge-sources/test/not-found-contract.md',
      ),
    ).rejects.toThrow(/HTTP 404/)
  })
})
