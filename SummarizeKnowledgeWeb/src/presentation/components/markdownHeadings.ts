export function markdownSlugBase(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('vi')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-') || 'section'
}

function createSlugger() {
  const counts = new Map<string, number>()
  return (value: string) => {
    const base = markdownSlugBase(value)
    const count = counts.get(base) ?? 0
    counts.set(base, count + 1)
    return count === 0 ? base : `${base}-${count}`
  }
}

function markdownHeadingText(value: string) {
  return value
    .replace(/!\[[^\]]*]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/[*_`~]/g, '')
    .trim()
}

export function getMarkdownHeadingData(markdown: string) {
  const makeSlug = createSlugger()
  const idsByLine = new Map<number, string>()
  const outline: Array<{ title: string; id: string }> = []

  markdown.split(/\r?\n/).forEach((line, index) => {
    const match = /^(#{1,4})\s+(.+)$/.exec(line)
    if (!match) return

    const title = markdownHeadingText(match[2])
    const id = makeSlug(title)
    idsByLine.set(index + 1, id)
    if (match[1].length === 2) outline.push({ title, id })
  })

  return { idsByLine, outline }
}
