import { BookOpen, FileText, Search, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { SourceContentLoader } from '../../application/use-cases/loadSourceContent'
import type { SourceDocument } from '../../domain/knowledge/SourceDocument'
import {
  getMarkdownHeadingData,
  markdownSlugBase,
} from './markdownHeadings'

interface SourceLibraryProps {
  readonly documents: readonly SourceDocument[]
  readonly totalWorkspaceFiles: number
  readonly loadSourceContent: SourceContentLoader
}

function normalizeSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('vi')
    .replace(/đ/g, 'd')
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value)
}

function resolveRelativeSourcePath(sourcePath: string, href: string) {
  if (!href || href.startsWith('#') || /^[a-z][a-z\d+.-]*:/i.test(href)) {
    return ''
  }
  let decodedPath = href.split(/[?#]/, 1)[0]
  try {
    decodedPath = decodeURIComponent(decodedPath)
  } catch {
    // Giữ nguyên path nếu source chứa URL encoding không hoàn chỉnh.
  }
  const segments = [
    ...sourcePath.split('/').slice(0, -1),
    ...decodedPath.replaceAll('\\', '/').split('/'),
  ]
  const normalized: string[] = []
  for (const segment of segments) {
    if (!segment || segment === '.') continue
    if (segment === '..') normalized.pop()
    else normalized.push(segment)
  }
  return normalized.join('/')
}

export function SourceLibrary({
  documents,
  totalWorkspaceFiles,
  loadSourceContent,
}: SourceLibraryProps) {
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState(documents[0]?.id ?? '')
  const [loadedSource, setLoadedSource] = useState({
    url: '',
    markdown: '',
    error: '',
  })

  const filteredDocuments = useMemo(() => {
    const normalizedQuery = normalizeSearch(query.trim())
    if (!normalizedQuery) return documents
    return documents.filter((document) =>
      normalizeSearch(
        [document.title, ...document.sourcePaths].join(' '),
      ).includes(normalizedQuery),
    )
  }, [documents, query])
  const documentsBySourcePath = useMemo(
    () =>
      new Map(
        documents.flatMap((document) =>
          document.sourcePaths.map((sourcePath) => [sourcePath, document] as const),
        ),
      ),
    [documents],
  )

  const selectedDocument =
    documents.find((document) => document.id === selectedId) ?? documents[0]
  const selectedUrl = selectedDocument?.assetPath ?? ''

  useEffect(() => {
    if (!selectedDocument || !selectedUrl) return

    const controller = new AbortController()
    loadSourceContent(selectedDocument, controller.signal)
      .then((content) => {
        setLoadedSource({ url: selectedUrl, markdown: content, error: '' })
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === 'AbortError') return
        setLoadedSource({
          url: selectedUrl,
          markdown: '',
          error: 'Không thể tải tài liệu. Hãy chạy lại npm run sync:sources.',
        })
      })

    return () => controller.abort()
  }, [loadSourceContent, selectedDocument, selectedUrl])

  const loading = loadedSource.url !== selectedUrl
  const error = loadedSource.url === selectedUrl ? loadedSource.error : ''
  const markdown = loadedSource.url === selectedUrl ? loadedSource.markdown : ''
  const sourceHeadingData = useMemo(
    () => getMarkdownHeadingData(markdown),
    [markdown],
  )
  const sourceHeadingIds = useMemo(
    () => new Set(sourceHeadingData.idsByLine.values()),
    [sourceHeadingData],
  )

  const topicFileCount = documents.reduce(
    (sum, document) => sum + document.sourcePaths.length,
    0,
  )
  const topicWordCount = documents.reduce(
    (sum, document) => sum + (document.isAggregate ? 0 : document.wordCount),
    0,
  )

  if (!selectedDocument) {
    return (
      <section className="source-library source-library--empty">
        <FileText size={28} />
        <h2>Chưa có tài liệu nguồn</h2>
        <p>Thêm mapping rồi chạy npm run sync:sources để cập nhật.</p>
      </section>
    )
  }

  return (
    <section className="source-library" aria-label="Tài liệu Markdown chi tiết">
      <header className="source-library__summary">
        <div>
          <span className="source-library__eyebrow">Coverage đã kiểm tra</span>
          <h2>Đọc nguyên bản tài liệu Markdown</h2>
          <p>
            {formatNumber(topicFileCount)} file của chủ đề này ·{' '}
            {formatNumber(topicWordCount)} từ · {formatNumber(totalWorkspaceFiles)} file
            trong toàn workspace.
          </p>
        </div>
        <BookOpen size={30} aria-hidden="true" />
      </header>

      <div className="source-browser">
        <aside className="source-browser__catalog" aria-label="Danh sách tài liệu">
          <div className="source-filter">
            <Search size={15} aria-hidden="true" />
            <label className="sr-only" htmlFor="source-document-search">
              Tìm trong tài liệu của chủ đề
            </label>
            <input
              id="source-document-search"
              type="search"
              value={query}
              placeholder="Tên hoặc đường dẫn file..."
              onChange={(event) => setQuery(event.target.value)}
            />
            {query && (
              <button
                type="button"
                aria-label="Xóa tìm kiếm tài liệu"
                onClick={() => setQuery('')}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="source-document-list">
            {filteredDocuments.map((document) => (
              <button
                key={document.id}
                type="button"
                data-active={document.id === selectedDocument.id}
                aria-current={
                  document.id === selectedDocument.id ? 'true' : undefined
                }
                onClick={() => setSelectedId(document.id)}
              >
                <FileText size={16} aria-hidden="true" />
                <span>
                  <strong>{document.title}</strong>
                  <small>{document.sourcePaths[0]}</small>
                  {document.isAggregate && (
                    <small className="source-document-list__aggregate">
                      Bản tổng hợp · không cộng lại vào thống kê
                    </small>
                  )}
                </span>
              </button>
            ))}
            {filteredDocuments.length === 0 && (
              <p className="source-document-list__empty">Không tìm thấy tài liệu.</p>
            )}
          </div>
        </aside>

        <div className="source-reader">
          <header className="source-reader__header">
            <div>
              <span>Tài liệu chi tiết</span>
              <h2>{selectedDocument.title}</h2>
              {selectedDocument.sourcePaths.map((sourcePath) => (
                <code key={sourcePath}>{sourcePath}</code>
              ))}
              {selectedDocument.isAggregate && (
                <p className="source-reader__aggregate-note">
                  Bản tổng hợp · không cộng lại vào thống kê
                </p>
              )}
            </div>
            <small>
              {formatNumber(selectedDocument.wordCount)} từ ·{' '}
              {formatNumber(selectedDocument.lineCount)} dòng
            </small>
          </header>

          {loading && (
            <p className="source-reader__status" role="status">
              Đang tải Markdown…
            </p>
          )}
          {error && (
            <p className="source-reader__status source-reader__status--error" role="alert">
              {error}
            </p>
          )}
          {!loading && !error && (
            <article className="knowledge-article source-reader__article">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  a: ({ href = '', children }) => {
                    if (/^https?:/i.test(href)) {
                      return (
                        <a href={href} target="_blank" rel="noreferrer">
                          {children}
                        </a>
                      )
                    }
                    if (href.startsWith('#')) {
                      let fragment = href.slice(1)
                      try {
                        fragment = decodeURIComponent(fragment)
                      } catch {
                        // Fallback về fragment thô nếu URL encoding bị lỗi.
                      }
                      const normalizedFragment = markdownSlugBase(fragment)
                      const targetId = sourceHeadingIds.has(normalizedFragment)
                        ? normalizedFragment
                        : fragment
                      return <a href={`#${targetId}`}>{children}</a>
                    }
                    const relatedSourcePath = resolveRelativeSourcePath(
                      selectedDocument.sourcePaths[0],
                      href,
                    )
                    const relatedDocument = documentsBySourcePath.get(relatedSourcePath)
                    if (relatedDocument) {
                      return (
                        <button
                          type="button"
                          className="source-document-link"
                          title={relatedSourcePath}
                          onClick={() => {
                            setQuery('')
                            setSelectedId(relatedDocument.id)
                          }}
                        >
                          {children}
                        </button>
                      )
                    }
                    return (
                      <span className="source-relative-link" title={href}>
                        {children}
                      </span>
                    )
                  },
                  h1: ({ node, children }) => (
                    <h1 id={sourceHeadingData.idsByLine.get(node?.position?.start.line ?? -1)}>
                      {children}
                    </h1>
                  ),
                  h2: ({ node, children }) => (
                    <h2 id={sourceHeadingData.idsByLine.get(node?.position?.start.line ?? -1)}>
                      {children}
                    </h2>
                  ),
                  h3: ({ node, children }) => (
                    <h3 id={sourceHeadingData.idsByLine.get(node?.position?.start.line ?? -1)}>
                      {children}
                    </h3>
                  ),
                  h4: ({ node, children }) => (
                    <h4 id={sourceHeadingData.idsByLine.get(node?.position?.start.line ?? -1)}>
                      {children}
                    </h4>
                  ),
                  img: ({ alt, src }) => (
                    <span className="source-image-reference">
                      Hình minh họa: {alt || src || 'xem trong source gốc'}
                    </span>
                  ),
                  table: ({ children }) => (
                    <div className="table-scroll">
                      <table>{children}</table>
                    </div>
                  ),
                }}
              >
                {markdown}
              </ReactMarkdown>
            </article>
          )}
        </div>
      </div>
    </section>
  )
}
