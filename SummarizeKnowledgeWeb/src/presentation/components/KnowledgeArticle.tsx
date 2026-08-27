import { Copy, ListTree } from 'lucide-react'
import {
  isValidElement,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { KnowledgeTopic } from '../../domain/knowledge/KnowledgeTopic'
import { getMarkdownHeadingData, markdownSlugBase } from './markdownHeadings'

function textFromChildren(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textFromChildren).join('')
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return textFromChildren(node.props.children)
  }
  return ''
}

function decodeHash(value: string) {
  try {
    return decodeURIComponent(value.replace(/^#/, ''))
  } catch {
    return ''
  }
}

function CopyButton({ value }: { readonly value: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    if (!navigator.clipboard) return
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1400)
    } catch {
      setCopied(false)
    }
  }

  return (
    <button type="button" onClick={copy} className="copy-button">
      <Copy size={14} /> {copied ? 'Đã chép' : 'Sao chép'}
    </button>
  )
}

interface KnowledgeArticleProps {
  readonly topic: KnowledgeTopic
}

export function KnowledgeArticle({ topic }: KnowledgeArticleProps) {
  const headingData = useMemo(
    () => getMarkdownHeadingData(topic.content),
    [topic.content],
  )

  useEffect(() => {
    const targetId = decodeHash(window.location.hash)
    if (!targetId) return

    const frame = window.requestAnimationFrame(() => {
      const target = document.getElementById(targetId)
      const reducedMotion = window.matchMedia?.(
        '(prefers-reduced-motion: reduce)',
      ).matches
      target?.scrollIntoView?.({
        behavior: reducedMotion ? 'auto' : 'smooth',
        block: 'start',
      })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [topic.id])

  return (
    <div className="article-layout">
      <article className="knowledge-article">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h2: ({ node, children }) => (
              <h2
                id={
                  headingData.idsByLine.get(node?.position?.start.line ?? -1) ??
                  markdownSlugBase(textFromChildren(children))
                }
              >
                {children}
              </h2>
            ),
            h3: ({ node, children }) => (
              <h3
                id={
                  headingData.idsByLine.get(node?.position?.start.line ?? -1) ??
                  markdownSlugBase(textFromChildren(children))
                }
              >
                {children}
              </h3>
            ),
            a: ({ href, children }) => (
              <a
                href={href}
                target={href?.startsWith('http') ? '_blank' : undefined}
                rel={href?.startsWith('http') ? 'noreferrer' : undefined}
              >
                {children}
              </a>
            ),
            table: ({ children }) => (
              <div className="table-scroll">
                <table>{children}</table>
              </div>
            ),
            pre: ({ children }) => {
              const code = String(
                (children as { props?: { children?: unknown } })?.props?.children ??
                  '',
              ).replace(/\n$/, '')
              return (
                <div className="code-block">
                  <div className="code-block__bar">
                    <span>Code</span>
                    <CopyButton value={code} />
                  </div>
                  <pre>{children}</pre>
                </div>
              )
            },
          }}
        >
          {topic.content}
        </ReactMarkdown>
      </article>

      <aside className="article-outline" aria-label="Mục lục bài viết">
        <div className="article-outline__title">
          <ListTree size={16} /> Trong bài này
        </div>
        <nav>
          {headingData.outline.map((item) => (
            <a key={`${item.id}-${item.title}`} href={`#${item.id}`}>
              {item.title}
            </a>
          ))}
        </nav>
      </aside>
    </div>
  )
}
