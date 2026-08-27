import { createHash, randomUUID } from 'node:crypto'
import {
  mkdir,
  open,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const workspaceRoot = path.dirname(projectRoot)
const publicRoot = path.join(projectRoot, 'public', 'knowledge-sources')
const generatedRoot = path.join(projectRoot, 'src', 'content', 'generated')
const mappingPath = path.join(projectRoot, 'scripts', 'source-topic-map.json')
const knowledgeRoot = path.join(projectRoot, 'src', 'content', 'knowledge')
const lockPath = path.join(projectRoot, '.source-sync.lock')

const ignoredDirectories = new Set([
  '.git',
  '.idea',
  '.m2',
  '.next',
  '.nuget',
  '.terraform',
  '.venv',
  '.vite',
  '.vs',
  '__pycache__',
  'bin',
  'build',
  'coverage',
  'dist',
  'node_modules',
  'obj',
  'out',
  'target',
  'vendor',
])

function normalizedPath(value) {
  return value.split(path.sep).join('/')
}

function markdownHash(content) {
  return createHash('sha256')
    .update(content.replace(/\r\n/g, '\n').trim())
    .digest('hex')
}

function assertGeneratedPath(target) {
  const relative = path.relative(projectRoot, target)
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Từ chối ghi ngoài project: ${target}`)
  }
}

async function readJson(target) {
  return JSON.parse(await readFile(target, 'utf8'))
}

async function getTopicIds() {
  const entries = await readdir(knowledgeRoot, { withFileTypes: true })
  const ids = new Set()
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const metadata = await readJson(path.join(knowledgeRoot, entry.name, 'meta.json'))
    ids.add(metadata.id)
  }
  return ids
}

async function collectMarkdownFiles(root, files = []) {
  const entries = await readdir(root, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue
    const target = path.join(root, entry.name)
    if (entry.isDirectory()) {
      await collectMarkdownFiles(target, files)
    } else if (entry.isFile() && /\.md$/i.test(entry.name)) {
      files.push(target)
    }
  }
  return files
}

function stripMarkdown(value) {
  return value
    .replace(/!\[([^\]]*)]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/[*_`~#]/g, '')
    .trim()
}

function readDocumentInfo(content, sourcePath) {
  const headings = content
    .split(/\r?\n/)
    .map((line) => /^(#{1,4})\s+(.+?)\s*$/.exec(line))
    .filter(Boolean)
    .map((match) => stripMarkdown(match[2]))
    .filter(Boolean)

  const filename = path.posix.basename(sourcePath, path.posix.extname(sourcePath))
  const parent = path.posix.basename(path.posix.dirname(sourcePath))
  const fallbackTitle = filename.toLowerCase() === 'readme' ? parent : filename
  const wordCount = (content.match(/[\p{L}\p{N}]+/gu) ?? []).length

  return {
    title: headings[0] ?? fallbackTitle.replace(/[-_]+/g, ' '),
    wordCount,
    lineCount: content.split(/\r?\n/).length,
  }
}

function classify(sourcePath, rules, fallbacks) {
  const matchingRules = rules.filter((rule) => new RegExp(rule.pattern).test(sourcePath))
  if (matchingRules.length > 1) {
    throw new Error(
      `${sourcePath}: khớp nhiều rule (${matchingRules.map((rule) => rule.topicId).join(', ')})`,
    )
  }
  if (matchingRules.length === 1) return matchingRules[0].topicId
  return fallbacks[sourcePath.split('/')[0]]
}

async function acquireLock() {
  const token = randomUUID()
  for (let attempt = 0; attempt < 300; attempt += 1) {
    try {
      const handle = await open(lockPath, 'wx')
      await handle.writeFile(JSON.stringify({ pid: process.pid, token }), 'utf8')
      return { handle, token }
    } catch (error) {
      if (error?.code !== 'EEXIST') throw error
      try {
        const owner = JSON.parse(await readFile(lockPath, 'utf8'))
        if (Number.isInteger(owner.pid) && !isProcessRunning(owner.pid)) {
          await rm(lockPath, { force: true })
          continue
        }
      } catch (lockError) {
        if (lockError?.code === 'ENOENT') continue
        const lockInfo = await stat(lockPath)
        if (Date.now() - lockInfo.mtimeMs > 120_000) {
          await rm(lockPath, { force: true })
          continue
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }
  throw new Error('Source sync đang bị khóa quá 30 giây bởi một tiến trình khác.')
}

function isProcessRunning(pid) {
  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    return error?.code !== 'ESRCH'
  }
}

async function writeAtomically(target, content, token) {
  const temporary = `${target}.${process.pid}.${token}.tmp`
  await writeFile(temporary, content, 'utf8')
  try {
    await rename(temporary, target)
  } catch (error) {
    await rm(temporary, { force: true })
    throw error
  }
}

async function writeContentAsset(target, content, expectedHash, token) {
  try {
    const existing = await readFile(target, 'utf8')
    if (markdownHash(existing) === expectedHash) return
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error
  }
  await writeAtomically(target, content, token)
}

async function releaseLock(lock) {
  await lock.handle.close()
  try {
    const owner = JSON.parse(await readFile(lockPath, 'utf8'))
    if (owner.token === lock.token) await rm(lockPath, { force: true })
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error
  }
}

async function syncSources(syncToken) {
const mapping = await readJson(mappingPath)
const topicIds = await getTopicIds()
if (new Set(mapping.sourceRoots).size !== mapping.sourceRoots.length) {
  throw new Error('source-topic-map.json có sourceRoots bị trùng.')
}
const compiledRules = mapping.rules.map((rule) => {
  if (!topicIds.has(rule.topicId)) {
    throw new Error(`Rule trỏ tới topic không tồn tại: ${rule.topicId}`)
  }
  try {
    new RegExp(rule.pattern)
  } catch (error) {
    throw new Error(`Regex không hợp lệ "${rule.pattern}": ${error.message}`, {
      cause: error,
    })
  }
  return rule
})
const aggregatePatterns = (mapping.aggregatePatterns ?? []).map((pattern) => {
  if (typeof pattern !== 'string' || pattern.trim() === '') {
    throw new Error('aggregatePatterns chỉ được chứa regex dạng chuỗi không trống.')
  }
  try {
    return new RegExp(pattern)
  } catch (error) {
    throw new Error(`Regex aggregate không hợp lệ "${pattern}": ${error.message}`, {
      cause: error,
    })
  }
})

for (const topicId of Object.values(mapping.fallbacks)) {
  if (!topicIds.has(topicId)) throw new Error(`Fallback trỏ tới topic không tồn tại: ${topicId}`)
}

const configuredRoots = new Set(mapping.sourceRoots)
const workspaceEntries = await readdir(workspaceRoot, { withFileTypes: true })
const unconfiguredMarkdownRoots = []
const rootMarkdownFiles = workspaceEntries.filter(
  (entry) => entry.isFile() && /\.md$/i.test(entry.name),
)
if (rootMarkdownFiles.length > 0) {
  unconfiguredMarkdownRoots.push(
    `[workspace root] (${rootMarkdownFiles.length} Markdown; hãy đưa vào một source folder)`,
  )
}
for (const entry of workspaceEntries) {
  if (
    !entry.isDirectory() ||
    entry.name === path.basename(projectRoot) ||
    ignoredDirectories.has(entry.name) ||
    configuredRoots.has(entry.name)
  ) {
    continue
  }
  const markdownFiles = await collectMarkdownFiles(path.join(workspaceRoot, entry.name))
  if (markdownFiles.length > 0) {
    unconfiguredMarkdownRoots.push(`${entry.name} (${markdownFiles.length} Markdown)`)
  }
}
if (unconfiguredMarkdownRoots.length > 0) {
  throw new Error(
    `Phát hiện source root có Markdown nhưng chưa được mapping:\n- ${unconfiguredMarkdownRoots.join('\n- ')}\nDùng topic:new --source-root hoặc cập nhật scripts/source-topic-map.json.`,
  )
}

const sourceFiles = []
for (const sourceRoot of mapping.sourceRoots) {
  const absoluteRoot = path.resolve(workspaceRoot, sourceRoot)
  const relativeToWorkspace = path.relative(workspaceRoot, absoluteRoot)
  if (relativeToWorkspace.startsWith('..') || path.isAbsolute(relativeToWorkspace)) {
    throw new Error(`Source root nằm ngoài workspace: ${sourceRoot}`)
  }
  const files = await collectMarkdownFiles(absoluteRoot)
  sourceFiles.push(...files)
}

const classified = []
const uncovered = []
for (const absolutePath of sourceFiles) {
  const sourcePath = normalizedPath(path.relative(workspaceRoot, absolutePath))
  const topicId = classify(sourcePath, compiledRules, mapping.fallbacks)
  if (!topicId) {
    uncovered.push(sourcePath)
    continue
  }
  const content = await readFile(absolutePath, 'utf8')
  classified.push({
    absolutePath,
    sourcePath,
    topicId,
    content,
    isAggregate: aggregatePatterns.some((pattern) => pattern.test(sourcePath)),
  })
}

if (uncovered.length > 0) {
  throw new Error(`Markdown chưa được phân loại:\n- ${uncovered.join('\n- ')}`)
}

for (const aggregatePattern of aggregatePatterns) {
  if (!classified.some((item) => aggregatePattern.test(item.sourcePath))) {
    throw new Error(
      `aggregatePatterns không khớp Markdown nào: ${aggregatePattern.source}`,
    )
  }
}

const byHash = new Map()
for (const item of classified) {
  const hash = markdownHash(item.content)
  const existing = byHash.get(hash)
  if (existing) {
    if (existing.topicId !== item.topicId) {
      throw new Error(
        `Hai file trùng nội dung nhưng bị gán khác topic: ${existing.sourcePaths[0]} và ${item.sourcePath}`,
      )
    }
    existing.sourcePaths.push(item.sourcePath)
    existing.isAggregate = existing.isAggregate && item.isAggregate
  } else {
    byHash.set(hash, {
      ...item,
      hash,
      sourcePaths: [item.sourcePath],
    })
  }
}

assertGeneratedPath(publicRoot)
assertGeneratedPath(generatedRoot)
await mkdir(publicRoot, { recursive: true })
await mkdir(generatedRoot, { recursive: true })

const catalogPath = path.join(generatedRoot, 'sourceCatalog.json')
let previousAssetPaths = new Set()
try {
  const previousCatalog = await readJson(catalogPath)
  previousAssetPaths = new Set(
    Array.isArray(previousCatalog.documents)
      ? previousCatalog.documents
          .map((document) => document.assetPath)
          .filter((assetPath) => typeof assetPath === 'string')
      : [],
  )
} catch {
  // Catalog cũ hỏng/không tồn tại không được phép chặn việc tái tạo catalog mới.
}

const documents = []
for (const item of byHash.values()) {
  const id = `${item.topicId}-${createHash('sha1').update(item.sourcePaths[0]).digest('hex').slice(0, 12)}`
  const assetPath = `knowledge-sources/${item.topicId}/${id}-${item.hash.slice(0, 12)}.md`
  const outputPath = path.join(projectRoot, 'public', ...assetPath.split('/'))
  assertGeneratedPath(outputPath)
  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeContentAsset(outputPath, item.content, item.hash, syncToken)
  documents.push({
    id,
    topicId: item.topicId,
    ...readDocumentInfo(item.content, item.sourcePaths[0]),
    sourcePaths: item.sourcePaths.sort(),
    assetPath,
    isAggregate: item.isAggregate,
  })
}

documents.sort(
  (left, right) =>
    left.topicId.localeCompare(right.topicId) ||
    left.sourcePaths[0].localeCompare(right.sourcePaths[0]),
)

const topics = [...topicIds]
  .sort()
  .map((topicId) => {
    const topicDocuments = documents.filter((document) => document.topicId === topicId)
    return {
      topicId,
      documentCount: topicDocuments.length,
      sourceFileCount: topicDocuments.reduce(
        (sum, document) => sum + document.sourcePaths.length,
        0,
      ),
      wordCount: topicDocuments.reduce(
        (sum, document) => sum + (document.isAggregate ? 0 : document.wordCount),
        0,
      ),
      rawWordCount: topicDocuments.reduce(
        (sum, document) => sum + document.wordCount,
        0,
      ),
    }
  })

const catalog = {
  totalSourceFiles: classified.length,
  totalUniqueDocuments: documents.length,
  totalWords: documents.reduce(
    (sum, document) => sum + (document.isAggregate ? 0 : document.wordCount),
    0,
  ),
  totalRawWords: documents.reduce((sum, document) => sum + document.wordCount, 0),
  topics,
  documents,
}

await writeAtomically(
  catalogPath,
  `${JSON.stringify(catalog, null, 2)}\n`,
  syncToken,
)

const retainedAssets = new Set([
  ...documents.map((document) => document.assetPath),
  ...previousAssetPaths,
])
const generatedAssets = await collectMarkdownFiles(publicRoot)
for (const generatedAsset of generatedAssets) {
  const assetPath = normalizedPath(
    path.relative(path.join(projectRoot, 'public'), generatedAsset),
  )
  if (!retainedAssets.has(assetPath)) await rm(generatedAsset, { force: true })
}

console.log(
  `Source sync: ${catalog.totalSourceFiles} Markdown → ${catalog.totalUniqueDocuments} tài liệu, ${catalog.totalWords.toLocaleString('vi-VN')} từ không tính lại bản tổng hợp.`,
)
for (const topic of topics) {
  console.log(
    `- ${topic.topicId}: ${topic.sourceFileCount} file / ${topic.documentCount} tài liệu / ${topic.wordCount.toLocaleString('vi-VN')} từ`,
  )
}
}

const syncLock = await acquireLock()
try {
  await syncSources(syncLock.token)
} finally {
  await releaseLock(syncLock)
}
