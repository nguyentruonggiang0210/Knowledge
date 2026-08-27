import type {
  KnowledgeSearchResult,
  KnowledgeTopic,
} from '../../domain/knowledge/KnowledgeTopic'

const MAX_RESULTS = 8

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('vi')
    .replace(/đ/g, 'd')
    .trim()
}

function plainText(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
    .replace(/[#>*_|~-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractHeadings(markdown: string) {
  return [...markdown.matchAll(/^#{2,4}\s+(.+)$/gm)].map((match) =>
    match[1].replace(/[*_`]/g, '').trim(),
  )
}

function makeExcerpt(topic: KnowledgeTopic, queryTerms: readonly string[]) {
  const text = plainText(topic.content)
  const normalizedText = normalize(text)
  const firstIndex = queryTerms.reduce((closest, term) => {
    const index = normalizedText.indexOf(term)
    if (index < 0) return closest
    return closest < 0 ? index : Math.min(closest, index)
  }, -1)

  if (firstIndex < 0) return topic.description

  const start = Math.max(0, firstIndex - 68)
  const end = Math.min(text.length, firstIndex + 150)
  return `${start > 0 ? '…' : ''}${text.slice(start, end).trim()}${end < text.length ? '…' : ''}`
}

export function searchKnowledgeCatalog(
  topics: readonly KnowledgeTopic[],
  query: string,
): readonly KnowledgeSearchResult[] {
  const terms = normalize(query).split(/\s+/).filter(Boolean)
  if (terms.length === 0) return []

  return topics
    .map<KnowledgeSearchResult | null>((topic) => {
      const title = normalize(`${topic.title} ${topic.navTitle} ${topic.eyebrow}`)
      const overview = normalize(`${topic.description} ${topic.outcomes.join(' ')}`)
      const tags = normalize(topic.tags.join(' '))
      const sources = normalize(topic.sourceFolders.join(' '))
      const headings = extractHeadings(topic.content)
      const normalizedHeadings = headings.map(normalize)
      const body = normalize(plainText(topic.content))

      const allTermsMatch = terms.every(
        (term) =>
          title.includes(term) ||
          overview.includes(term) ||
          tags.includes(term) ||
          sources.includes(term) ||
          normalizedHeadings.some((heading) => heading.includes(term)) ||
          body.includes(term),
      )

      if (!allTermsMatch) return null

      const score = terms.reduce((total, term) => {
        if (title.includes(term)) return total + 12
        if (tags.includes(term)) return total + 8
        if (overview.includes(term)) return total + 6
        if (normalizedHeadings.some((heading) => heading.includes(term))) {
          return total + 5
        }
        if (sources.includes(term)) return total + 3
        return total + 1
      }, 0)

      return {
        topic,
        score,
        excerpt: makeExcerpt(topic, terms),
        matches: headings.filter((heading) =>
          terms.some((term) => normalize(heading).includes(term)),
        ),
      }
    })
    .filter((result): result is KnowledgeSearchResult => result !== null)
    .sort((left, right) => right.score - left.score || left.topic.order - right.topic.order)
    .slice(0, MAX_RESULTS)
}
