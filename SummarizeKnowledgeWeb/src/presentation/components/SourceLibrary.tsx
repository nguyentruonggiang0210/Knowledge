import { BookOpen, FileText, Search, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { SourceContentLoader } from '../../application/use-cases/loadSourceContent'
import type { SourceDocument } from '../../domain/knowledge/SourceDocument'
import { useI18n } from '../i18n/I18nProvider'
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
    .toLocaleLowerCase()
    .replace(/đ/g, 'd')
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

function sourceRepositoryHref(sourcePath: string, href: string) {
  const resolvedPath = resolveRelativeSourcePath(sourcePath, href)
  if (!resolvedPath) return ''
  const rawPath = href.split(/[?#]/, 1)[0].replaceAll('\\', '/')
  const lastSegment = rawPath.split('/').filter(Boolean).at(-1) ?? ''
  const looksLikeDirectory =
    rawPath.endsWith('/') || (!lastSegment.includes('.') && lastSegment !== 'Dockerfile')
  const encodedPath = resolvedPath.split('/').map(encodeURIComponent).join('/')
  return `https://github.com/nguyentruonggiang0210/Knowledge/${
    looksLikeDirectory ? 'tree' : 'blob'
  }/main/${encodedPath}`
}

export function SourceLibrary({
  documents,
  totalWorkspaceFiles,
  loadSourceContent,
}: SourceLibraryProps) {
  const { formatNumber, t } = useI18n()
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
          error: t('source.loadError'),
        })
      })

    return () => controller.abort()
  }, [loadSourceContent, selectedDocument, selectedUrl, t])

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
        <h2>{t('source.emptyTitle')}</h2>
        <p>{t('source.emptyBody')}</p>
      </section>
    )
  }

  return (
    <section className="source-library" aria-label={t('source.sectionLabel')}>
      <header className="source-library__summary">
        <div>
          <span className="source-library__eyebrow">{t('source.coverage')}</span>
          <h2>{t('source.readOriginal')}</h2>
          <p>
            {t('source.summary', {
              topicFiles: formatNumber(topicFileCount),
              words: formatNumber(topicWordCount),
              workspaceFiles: formatNumber(totalWorkspaceFiles),
            })}
          </p>
        </div>
        <BookOpen size={30} aria-hidden="true" />
      </header>

      <div className="source-browser">
        <aside className="source-browser__catalog" aria-label={t('source.catalog')}>
          <div className="source-filter">
            <Search size={15} aria-hidden="true" />
            <label className="sr-only" htmlFor="source-document-search">
              {t('source.search')}
            </label>
            <input
              id="source-document-search"
              type="search"
              value={query}
              placeholder={t('source.searchPlaceholder')}
              onChange={(event) => setQuery(event.target.value)}
            />
            {query && (
              <button
                type="button"
                aria-label={t('source.clearSearch')}
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
                      {t('source.aggregate')}
                    </small>
                  )}
                </span>
              </button>
            ))}
            {filteredDocuments.length === 0 && (
              <p className="source-document-list__empty">{t('source.noResults')}</p>
            )}
          </div>
        </aside>

        <div className="source-reader">
          <header className="source-reader__header">
            <div>
              <span>{t('source.detail')}</span>
              <h2>{selectedDocument.title}</h2>
              {selectedDocument.sourcePaths.map((sourcePath) => (
                <code key={sourcePath}>{sourcePath}</code>
              ))}
              {selectedDocument.isAggregate && (
                <p className="source-reader__aggregate-note">
                  {t('source.aggregate')}
                </p>
              )}
            </div>
            <small>
              {t('source.metrics', {
                words: formatNumber(selectedDocument.wordCount),
                lines: formatNumber(selectedDocument.lineCount),
              })}
            </small>
          </header>

          {loading && (
            <p className="source-reader__status" role="status">
              {t('source.loading')}
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
                    const repositoryHref = sourceRepositoryHref(
                      selectedDocument.sourcePaths[0],
                      href,
                    )
                    return repositoryHref ? (
                      <a
                        className="source-relative-link"
                        href={repositoryHref}
                        target="_blank"
                        rel="noreferrer"
                        title={relatedSourcePath || href}
                      >
                        {children}
                      </a>
                    ) : (
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
                      {t('source.image', {
                        description: alt || src || t('source.imageFallback'),
                      })}
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
