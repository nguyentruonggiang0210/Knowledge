import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const workspaceRoot = path.dirname(projectRoot)
const knowledgeRoot = path.join(projectRoot, 'src', 'content', 'knowledge')
const sourceCatalogPath = path.join(
  projectRoot,
  'src',
  'content',
  'generated',
  'sourceCatalog.json',
)
const requiredStrings = [
  'id',
  'title',
  'navTitle',
  'eyebrow',
  'description',
  'icon',
  'accent',
  'level',
]
const requiredArrays = ['tags', 'sourceFolders', 'outcomes']
const allowedAccents = new Set(['lime', 'sky', 'violet', 'coral', 'amber', 'mint'])
const allowedLevels = new Set(['Nền tảng', 'Trung cấp', 'Nâng cao', 'Thực chiến'])
const allowedDifficulties = new Set(['Cơ bản', 'Trung cấp', 'Nâng cao'])
const errors = []
const ids = new Map()
const orders = new Map()
const questionIds = new Map()
const questionTexts = new Map()

function markdownHash(content) {
  return createHash('sha256')
    .update(content.replace(/\r\n/g, '\n').trim())
    .digest('hex')
}

function resolveInside(root, relativePath, label) {
  const target = path.resolve(root, ...relativePath.replaceAll('\\', '/').split('/'))
  const relative = path.relative(root, target)
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    errors.push(`${label}: đường dẫn vượt ra ngoài phạm vi (${relativePath})`)
    return null
  }
  return target
}

async function parseJson(target, label) {
  try {
    return JSON.parse(await readFile(target, 'utf8'))
  } catch (error) {
    errors.push(`${label}: JSON không hợp lệ (${error.message})`)
    return null
  }
}

const sourceCatalog = await parseJson(sourceCatalogPath, 'sourceCatalog.json')
const sourceOwnership = new Map()

if (sourceCatalog && Array.isArray(sourceCatalog.documents)) {
  let calculatedWords = 0
  let calculatedRawWords = 0
  for (const document of sourceCatalog.documents) {
    if (!document || typeof document !== 'object' || !Array.isArray(document.sourcePaths)) {
      errors.push('sourceCatalog.json: document không đúng schema')
      continue
    }
    if (
      !Number.isFinite(document.wordCount) ||
      document.wordCount < 0 ||
      typeof document.isAggregate !== 'boolean'
    ) {
      errors.push(`sourceCatalog.json: document ${document.id ?? '(không id)'} thiếu wordCount/isAggregate hợp lệ`)
    } else {
      calculatedRawWords += document.wordCount
      if (!document.isAggregate) calculatedWords += document.wordCount
    }
    if (typeof document.assetPath !== 'string' || document.assetPath.trim() === '') {
      errors.push(`sourceCatalog.json: document ${document.id ?? '(không id)'} thiếu assetPath`)
    }
    let assetContent = null
    if (typeof document.assetPath === 'string') {
      const assetTarget = resolveInside(
        path.join(projectRoot, 'public'),
        document.assetPath,
        'sourceCatalog.json assetPath',
      )
      if (assetTarget) {
        try {
          assetContent = await readFile(assetTarget, 'utf8')
        } catch (error) {
          errors.push(
            `sourceCatalog.json: không đọc được asset ${document.assetPath} (${error.message})`,
          )
        }
      }
    }
    for (const sourcePath of document.sourcePaths) {
      if (sourceOwnership.has(sourcePath)) {
        errors.push(`Source Markdown bị phân loại lặp: ${sourcePath}`)
      } else {
        sourceOwnership.set(sourcePath, document.topicId)
      }
      const sourceTarget = resolveInside(workspaceRoot, sourcePath, 'sourceCatalog.json sourcePath')
      if (sourceTarget && assetContent !== null) {
        try {
          const sourceContent = await readFile(sourceTarget, 'utf8')
          if (markdownHash(sourceContent) !== markdownHash(assetContent)) {
            errors.push(`Asset không khớp Markdown nguồn: ${sourcePath}`)
          }
        } catch (error) {
          errors.push(`Không đọc được Markdown nguồn ${sourcePath} (${error.message})`)
        }
      }
    }
  }
  if (sourceCatalog.documents.length !== sourceCatalog.totalUniqueDocuments) {
    errors.push(
      `sourceCatalog.json: ${sourceCatalog.documents.length} document không khớp totalUniqueDocuments ${sourceCatalog.totalUniqueDocuments}`,
    )
  }
  if (sourceOwnership.size !== sourceCatalog.totalSourceFiles) {
    errors.push(
      `sourceCatalog.json: coverage ${sourceOwnership.size} file không khớp totalSourceFiles ${sourceCatalog.totalSourceFiles}`,
    )
  }
  if (calculatedWords !== sourceCatalog.totalWords) {
    errors.push(
      `sourceCatalog.json: totalWords ${sourceCatalog.totalWords} không khớp tổng đã khử bản aggregate ${calculatedWords}`,
    )
  }
  if (calculatedRawWords !== sourceCatalog.totalRawWords) {
    errors.push(
      `sourceCatalog.json: totalRawWords ${sourceCatalog.totalRawWords} không khớp tổng thô ${calculatedRawWords}`,
    )
  }
} else {
  errors.push('sourceCatalog.json: thiếu documents; chạy npm run sync:sources')
}

const entries = await readdir(knowledgeRoot, { withFileTypes: true })
const folders = entries.filter((entry) => entry.isDirectory())

if (folders.length === 0) errors.push('Catalog chưa có folder kiến thức nào.')

for (const folder of folders) {
  const folderPath = path.join(knowledgeRoot, folder.name)
  const files = new Set(await readdir(folderPath))

  for (const requiredFile of ['meta.json', 'content.md', 'questions.json']) {
    if (!files.has(requiredFile)) errors.push(`${folder.name}: thiếu ${requiredFile}`)
  }

  if (!files.has('meta.json') || !files.has('content.md')) continue

  const metadata = await parseJson(
    path.join(folderPath, 'meta.json'),
    `${folder.name}/meta.json`,
  )
  if (!metadata) continue

  if (typeof metadata !== 'object' || Array.isArray(metadata)) {
    errors.push(`${folder.name}/meta.json: root phải là object`)
    continue
  }

  for (const field of requiredStrings) {
    if (typeof metadata[field] !== 'string' || metadata[field].trim() === '') {
      errors.push(`${folder.name}: trường ${field} phải là chuỗi không trống`)
    }
  }

  if (
    [metadata.description, ...(metadata.outcomes ?? []), ...(metadata.sourceFolders ?? [])]
      .filter((value) => typeof value === 'string')
      .some((value) => /Thay bằng|Mục tiêu học tập|Viết một mô tả/i.test(value))
  ) {
    errors.push(`${folder.name}: metadata vẫn chứa nội dung template cần thay`)
  }

  for (const field of requiredArrays) {
    if (
      !Array.isArray(metadata[field]) ||
      metadata[field].length === 0 ||
      metadata[field].some(
        (item) => typeof item !== 'string' || item.trim() === '',
      )
    ) {
      errors.push(`${folder.name}: trường ${field} phải là mảng chuỗi không trống`)
    }
  }

  if (!Array.isArray(metadata.outcomes) || metadata.outcomes.length < 3) {
    errors.push(`${folder.name}: cần ít nhất 3 learning outcomes`)
  }
  if (!Number.isFinite(metadata.order) || metadata.order < 0) {
    errors.push(`${folder.name}: order phải là số không âm`)
  }
  if (!Number.isFinite(metadata.estimatedMinutes) || metadata.estimatedMinutes <= 0) {
    errors.push(`${folder.name}: estimatedMinutes phải là số dương`)
  }

  if (typeof metadata.id === 'string') {
    if (metadata.id !== folder.name) errors.push(`${folder.name}: id phải trùng tên folder`)
    if (ids.has(metadata.id)) {
      errors.push(`${folder.name}: id trùng với ${ids.get(metadata.id)}`)
    } else {
      ids.set(metadata.id, folder.name)
    }
  }

  if (Number.isFinite(metadata.order)) {
    if (orders.has(metadata.order)) {
      errors.push(`${folder.name}: order trùng với ${orders.get(metadata.order)}`)
    } else {
      orders.set(metadata.order, folder.name)
    }
  }

  if (!allowedAccents.has(metadata.accent)) {
    errors.push(`${folder.name}: accent không được hỗ trợ`)
  }
  if (!allowedLevels.has(metadata.level)) {
    errors.push(`${folder.name}: level không được hỗ trợ`)
  }

  const topicSourceCount = [...sourceOwnership.values()].filter(
    (topicId) => topicId === metadata.id,
  ).length
  if (topicSourceCount === 0) {
    errors.push(`${folder.name}: chưa có Markdown nguồn nào được mapping vào topic`)
  }

  if (Array.isArray(metadata.sourceFolders)) {
    const normalizedFolders = metadata.sourceFolders.map((sourceFolder) =>
      typeof sourceFolder === 'string'
        ? sourceFolder.replaceAll('\\', '/').replace(/\/+$/, '')
        : '',
    )
    if (new Set(normalizedFolders).size !== normalizedFolders.length) {
      errors.push(`${folder.name}: sourceFolders có đường dẫn trùng`)
    }
    const matchesFolder = (sourcePath, sourceFolder) =>
      sourcePath === sourceFolder || sourcePath.startsWith(`${sourceFolder}/`)
    const ownershipEntries = [...sourceOwnership.entries()]
    for (const sourceFolder of normalizedFolders.filter(Boolean)) {
      const matchedEntries = ownershipEntries.filter(([sourcePath]) =>
        matchesFolder(sourcePath, sourceFolder),
      )
      if (matchedEntries.length === 0) {
        errors.push(`${folder.name}: sourceFolders không khớp nguồn nào (${sourceFolder})`)
      }
      const foreignTopics = new Set(
        matchedEntries
          .map(([, topicId]) => topicId)
          .filter((topicId) => topicId !== metadata.id),
      )
      if (foreignTopics.size > 0) {
        errors.push(
          `${folder.name}: sourceFolders bao trùm nguồn của topic khác (${sourceFolder} → ${[...foreignTopics].join(', ')})`,
        )
      }
    }
    const uncoveredTopicSources = ownershipEntries
      .filter(([, topicId]) => topicId === metadata.id)
      .map(([sourcePath]) => sourcePath)
      .filter(
        (sourcePath) =>
          !normalizedFolders.some((sourceFolder) =>
            matchesFolder(sourcePath, sourceFolder),
          ),
      )
    if (uncoveredTopicSources.length > 0) {
      errors.push(
        `${folder.name}: sourceFolders chưa phủ ${uncoveredTopicSources.length} nguồn (ví dụ: ${uncoveredTopicSources.slice(0, 3).join(', ')})`,
      )
    }
  }

  const content = await readFile(path.join(folderPath, 'content.md'), 'utf8')
  const contentWordCount = (content.match(/[\p{L}\p{N}]+/gu) ?? []).length
  if (contentWordCount < 1_000) {
    errors.push(
      `${folder.name}/content.md: cần ít nhất 1.000 từ tóm tắt, hiện có ${contentWordCount}`,
    )
  }
  if (/^#\s+/m.test(content)) {
    errors.push(`${folder.name}/content.md: không dùng H1; title đã render từ meta.json`)
  }
  if ((content.match(/^##\s+/gm) ?? []).length < 6) {
    errors.push(`${folder.name}/content.md: cần ít nhất 6 section H2`)
  }

  if (!files.has('questions.json')) continue
  const questions = await parseJson(
    path.join(folderPath, 'questions.json'),
    `${folder.name}/questions.json`,
  )
  if (!questions) continue
  if (!Array.isArray(questions)) {
    errors.push(`${folder.name}/questions.json: root phải là array`)
    continue
  }
  if (questions.length < 15) {
    errors.push(`${folder.name}/questions.json: cần ít nhất 15 câu hỏi`)
  }

  const difficulties = new Set()
  const answerCounts = [0, 0, 0, 0]
  questions.forEach((question, index) => {
    const label = `${folder.name}/questions.json câu ${index + 1}`
    if (!question || typeof question !== 'object' || Array.isArray(question)) {
      errors.push(`${label}: phải là object`)
      return
    }

    for (const field of ['id', 'question', 'explanation', 'difficulty', 'source']) {
      if (typeof question[field] !== 'string' || question[field].trim() === '') {
        errors.push(`${label}: ${field} phải là chuỗi không trống`)
      }
    }
    if (typeof question.question === 'string') {
      const normalizedQuestion = question.question.trim().toLocaleLowerCase('vi')
      if (question.question.trim().length < 20) {
        errors.push(`${label}: câu hỏi quá ngắn để kiểm tra kiến thức`)
      }
      if (questionTexts.has(normalizedQuestion)) {
        errors.push(`${label}: nội dung câu hỏi trùng với ${questionTexts.get(normalizedQuestion)}`)
      } else {
        questionTexts.set(normalizedQuestion, label)
      }
    }
    if (
      typeof question.explanation === 'string' &&
      question.explanation.trim().length < 40
    ) {
      errors.push(`${label}: explanation cần ít nhất 40 ký tự`)
    }
    if (!Array.isArray(question.options) || question.options.length !== 4) {
      errors.push(`${label}: options phải có đúng 4 lựa chọn`)
    } else if (
      question.options.some(
        (option) => typeof option !== 'string' || option.trim() === '',
      )
    ) {
      errors.push(`${label}: mọi lựa chọn phải là chuỗi không trống`)
    } else if (new Set(question.options.map((option) => option.trim())).size !== 4) {
      errors.push(`${label}: 4 lựa chọn phải khác nhau`)
    }
    if (
      !Number.isInteger(question.answerIndex) ||
      question.answerIndex < 0 ||
      question.answerIndex > 3
    ) {
      errors.push(`${label}: answerIndex phải là số nguyên từ 0 đến 3`)
    } else {
      answerCounts[question.answerIndex] += 1
    }
    if (!allowedDifficulties.has(question.difficulty)) {
      errors.push(`${label}: difficulty không được hỗ trợ`)
    } else {
      difficulties.add(question.difficulty)
    }

    if (typeof question.id === 'string') {
      if (questionIds.has(question.id)) {
        errors.push(`${label}: id trùng với ${questionIds.get(question.id)}`)
      } else {
        questionIds.set(question.id, label)
      }
    }

    if (typeof question.source === 'string') {
      const normalizedSource = question.source.replaceAll('\\', '/')
      const owner = sourceOwnership.get(normalizedSource)
      if (!owner) {
        errors.push(`${label}: source không nằm trong coverage (${normalizedSource})`)
      } else if (owner !== metadata.id) {
        errors.push(
          `${label}: source thuộc topic ${owner}, không phải ${metadata.id} (${normalizedSource})`,
        )
      }
    }
  })

  for (const difficulty of allowedDifficulties) {
    if (!difficulties.has(difficulty)) {
      errors.push(`${folder.name}/questions.json: thiếu câu mức ${difficulty}`)
    }
  }
  if (Math.max(...answerCounts) - Math.min(...answerCounts) > 1) {
    errors.push(
      `${folder.name}/questions.json: vị trí đáp án đúng mất cân bằng (${answerCounts.join('/')})`,
    )
  }
}

const knownTopicIds = new Set(ids.keys())
if (sourceCatalog && Array.isArray(sourceCatalog.documents)) {
  for (const document of sourceCatalog.documents) {
    if (!knownTopicIds.has(document.topicId)) {
      errors.push(`sourceCatalog.json: topic không tồn tại (${document.topicId})`)
    }
  }
}

if (errors.length > 0) {
  console.error('Content validation thất bại:')
  for (const error of errors) console.error(`- ${error}`)
  process.exitCode = 1
} else {
  console.log(
    `Content validation: ${folders.length} chủ đề, ${sourceOwnership.size} Markdown, ${questionIds.size} câu hỏi hợp lệ.`,
  )
}
