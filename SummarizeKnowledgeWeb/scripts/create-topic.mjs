import { randomUUID } from 'node:crypto'
import {
  access,
  mkdir,
  open,
  readdir,
  readFile,
  rename,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises'
import { constants } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const workspaceRoot = path.dirname(projectRoot)
const knowledgeRoot = path.join(projectRoot, 'src', 'content', 'knowledge')
const mappingPath = path.join(projectRoot, 'scripts', 'source-topic-map.json')
const lockPath = path.join(projectRoot, '.source-sync.lock')
const args = process.argv.slice(2)
const force = args.includes('--force')
const sourceRootIndex = args.indexOf('--source-root')
const sourceRoot =
  sourceRootIndex >= 0 ? args[sourceRootIndex + 1]?.trim() : undefined
const missingSourceRoot =
  sourceRootIndex >= 0 && (!sourceRoot || sourceRoot.startsWith('--'))
const title = args
  .filter(
    (argument, index) =>
      argument !== '--force' &&
      argument !== '--source-root' &&
      (sourceRootIndex < 0 || index !== sourceRootIndex + 1),
  )
  .join(' ')
  .trim()

if (missingSourceRoot) {
  console.error('--source-root cần một tên folder trực tiếp trong workspace.')
  process.exitCode = 1
} else if (!title) {
  console.error(
    'Cách dùng: npm run topic:new -- "Tên kiến thức" [--source-root FolderNguồn] [--force]',
  )
  process.exitCode = 1
} else {
  let topicLock
  try {
    topicLock = await acquireLock()
    await createTopic(title, sourceRoot, topicLock.token)
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  } finally {
    if (topicLock) {
      try {
        await releaseLock(topicLock)
      } catch (error) {
        console.error(
          `Không thể giải phóng source lock: ${
            error instanceof Error ? error.message : String(error)
          }`,
        )
        process.exitCode = 1
      }
    }
  }
}

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function pathExists(target) {
  try {
    await access(target, constants.F_OK)
    return true
  } catch {
    return false
  }
}

async function acquireLock() {
  const token = randomUUID()
  for (let attempt = 0; attempt < 300; attempt += 1) {
    let handle
    try {
      handle = await open(lockPath, 'wx')
      await handle.writeFile(JSON.stringify({ pid: process.pid, token }), 'utf8')
      return { handle, token }
    } catch (error) {
      if (handle) {
        await handle.close().catch(() => undefined)
        try {
          const owner = JSON.parse(await readFile(lockPath, 'utf8'))
          if (owner.token === token) await rm(lockPath, { force: true })
        } catch {
          // Giữ lỗi ghi lock ban đầu; lần chạy sau sẽ dọn lock hỏng theo mtime.
        }
        throw error
      }
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
  throw new Error('Source sync/topic generator đang bị khóa quá 30 giây.')
}

function isProcessRunning(pid) {
  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    return error?.code !== 'ESRCH'
  }
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

async function writeAtomically(target, content, token) {
  const temporary = `${target}.${process.pid}.${token}.tmp`
  let committed = false
  try {
    await writeFile(temporary, content, 'utf8')
    await rename(temporary, target)
    committed = true
  } finally {
    if (!committed) await rm(temporary, { force: true })
  }
}

async function getExistingMetadata() {
  const entries = await readdir(knowledgeRoot, { withFileTypes: true })
  return Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        try {
          const raw = await readFile(
            path.join(knowledgeRoot, entry.name, 'meta.json'),
            'utf8',
          )
          return JSON.parse(raw)
        } catch {
          return null
        }
      }),
  )
}

function titleTokens(value) {
  const ignored = new Set(['and', 'va', 'the', 'cho', 'voi'])
  return new Set(
    slugify(value)
      .split('-')
      .filter((token) => token && !ignored.has(token))
      .map((token) => (token.length > 3 && token.endsWith('s') ? token.slice(0, -1) : token)),
  )
}

function similarity(left, right) {
  const leftTokens = titleTokens(left)
  const rightTokens = titleTokens(right)
  if (leftTokens.size === 0 || rightTokens.size === 0) return 0
  const overlap = [...leftTokens].filter((token) => rightTokens.has(token)).length
  return overlap / Math.min(leftTokens.size, rightTokens.size)
}

async function createTopic(topicTitle, requestedSourceRoot, operationToken) {
  const slug = slugify(topicTitle)
  if (!slug) {
    console.error('Tên kiến thức phải có ít nhất một chữ cái hoặc chữ số.')
    process.exitCode = 1
    return
  }

  const topicFolder = path.join(knowledgeRoot, slug)
  if (await pathExists(topicFolder)) {
    console.error(`Chủ đề đã tồn tại: ${path.relative(projectRoot, topicFolder)}`)
    process.exitCode = 1
    return
  }

  let sourceMapping
  let originalMapping
  if (requestedSourceRoot) {
    if (
      path.isAbsolute(requestedSourceRoot) ||
      requestedSourceRoot.includes('/') ||
      requestedSourceRoot.includes('\\') ||
      requestedSourceRoot === '.' ||
      requestedSourceRoot === '..'
    ) {
      console.error('--source-root phải là tên một folder trực tiếp trong workspace.')
      process.exitCode = 1
      return
    }
    const absoluteSourceRoot = path.join(workspaceRoot, requestedSourceRoot)
    if (!(await pathExists(absoluteSourceRoot))) {
      console.error(`Source root chưa tồn tại: ${absoluteSourceRoot}`)
      process.exitCode = 1
      return
    }
    if (!(await stat(absoluteSourceRoot)).isDirectory()) {
      console.error(`Source root không phải folder: ${absoluteSourceRoot}`)
      process.exitCode = 1
      return
    }
    originalMapping = await readFile(mappingPath, 'utf8')
    sourceMapping = JSON.parse(originalMapping)
    const existingOwner = sourceMapping.fallbacks?.[requestedSourceRoot]
    if (existingOwner && existingOwner !== slug) {
      console.error(
        `Source root ${requestedSourceRoot} đã thuộc topic ${existingOwner}; hãy gom vào topic đó.`,
      )
      process.exitCode = 1
      return
    }
  }

  const existingMetadata = (await getExistingMetadata()).filter(Boolean)
  const possibleDuplicate = existingMetadata.find((metadata) =>
    [metadata.id, metadata.title, metadata.navTitle]
      .filter((value) => typeof value === 'string')
      .some((value) => similarity(topicTitle, value) >= 0.75),
  )

  if (possibleDuplicate && !force) {
    console.error(
      `Chủ đề có thể trùng với "${possibleDuplicate.title}" (${possibleDuplicate.id}).`,
    )
    console.error('Hãy gom vào sourceFolders/content hiện có nếu cùng kiến thức.')
    console.error('Nếu chắc chắn là chủ đề khác, chạy lại với --force.')
    process.exitCode = 1
    return
  }

  const order =
    Math.max(
      0,
      ...existingMetadata.map((metadata) =>
        typeof metadata.order === 'number' ? metadata.order : 0,
      ),
    ) + 1
  const accents = ['lime', 'sky', 'violet', 'coral', 'amber', 'mint']
  const metadata = {
    id: slug,
    title: topicTitle,
    navTitle: topicTitle,
    eyebrow: 'Chủ đề mới • Cần hoàn thiện',
    description: 'Viết một mô tả ngắn giúp người học hiểu phạm vi của chủ đề này.',
    order,
    icon: 'braces',
    accent: accents[(order - 1) % accents.length],
    level: 'Nền tảng',
    estimatedMinutes: 10,
    tags: [topicTitle],
    sourceFolders: requestedSourceRoot
      ? [requestedSourceRoot]
      : ['Thay bằng đường dẫn nguồn'],
    outcomes: [
      'Mục tiêu học tập thứ nhất',
      'Mục tiêu học tập thứ hai',
      'Mục tiêu học tập thứ ba',
    ],
  }

  const article = `## Tổng quan\n\nTóm tắt vấn đề và lý do cần học.\n\n## Khái niệm cốt lõi\n\n- Khái niệm thứ nhất\n- Khái niệm thứ hai\n\n## Quy trình thực hành\n\n1. Bước một\n2. Bước hai\n3. Bước ba\n\n## Lỗi thường gặp\n\nNêu failure mode, anti-pattern và cách kiểm chứng.\n\n## Checklist\n\n- [ ] Tôi giải thích được khái niệm bằng từ ngữ của mình.\n- [ ] Tôi đã chạy một ví dụ nhỏ.\n- [ ] Tôi biết giới hạn và trade-off.\n`
  const questions = [
    {
      id: `${slug}-001`,
      question: 'Thay bằng câu hỏi kiểm tra kiến thức từ Markdown nguồn.',
      options: ['Đáp án đúng', 'Lựa chọn nhiễu 1', 'Lựa chọn nhiễu 2', 'Lựa chọn nhiễu 3'],
      answerIndex: 0,
      explanation: 'Giải thích vì sao đáp án đúng và các lựa chọn còn lại không phù hợp.',
      difficulty: 'Cơ bản',
      source: requestedSourceRoot
        ? `${requestedSourceRoot}/README.md`
        : 'Thay bằng đường dẫn Markdown nguồn',
    },
  ]

  const stagingFolder = path.join(
    projectRoot,
    `.topic-staging-${slug}-${process.pid}-${operationToken}`,
  )
  let mappingCommitted = false
  let topicCommitted = false
  let transactionError
  let rollbackError
  let cleanupError

  try {
    await mkdir(stagingFolder, { recursive: false })
    await Promise.all([
      writeFile(
        path.join(stagingFolder, 'meta.json'),
        `${JSON.stringify(metadata, null, 2)}\n`,
        'utf8',
      ),
      writeFile(path.join(stagingFolder, 'content.md'), article, 'utf8'),
      writeFile(
        path.join(stagingFolder, 'questions.json'),
        `${JSON.stringify(questions, null, 2)}\n`,
        'utf8',
      ),
    ])

    if (sourceMapping && requestedSourceRoot) {
      if (!sourceMapping.sourceRoots.includes(requestedSourceRoot)) {
        sourceMapping.sourceRoots.push(requestedSourceRoot)
        sourceMapping.sourceRoots.sort()
      }
      sourceMapping.fallbacks[requestedSourceRoot] = slug
      await writeAtomically(
        mappingPath,
        `${JSON.stringify(sourceMapping, null, 2)}\n`,
        operationToken,
      )
      mappingCommitted = true
    }

    await rename(stagingFolder, topicFolder)
    topicCommitted = true
  } catch (error) {
    transactionError = error
    if (mappingCommitted && !topicCommitted && originalMapping !== undefined) {
      try {
        await writeAtomically(mappingPath, originalMapping, `${operationToken}.rollback`)
      } catch (error) {
        rollbackError = error
      }
    }
  } finally {
    if (!topicCommitted) {
      try {
        await rm(stagingFolder, { recursive: true, force: true })
      } catch (error) {
        cleanupError = error
      }
    }
  }

  if (transactionError) {
    const failures = [transactionError, rollbackError, cleanupError].filter(Boolean)
    if (failures.length > 1) {
      throw new AggregateError(
        failures,
        'Tạo topic thất bại và không thể rollback hoàn toàn.',
        { cause: transactionError },
      )
    }
    throw transactionError
  }
  if (cleanupError) throw cleanupError

  console.log(`Đã tạo ${path.relative(projectRoot, topicFolder)}`)
  console.log('Chỉnh meta.json, content.md và tạo đủ ít nhất 15 câu trong questions.json.')
  if (requestedSourceRoot) {
    console.log(`Đã mapping toàn bộ Markdown trong ${requestedSourceRoot} vào ${slug}.`)
  } else {
    console.log('Cập nhật scripts/source-topic-map.json để mapping Markdown nguồn.')
  }
  console.log('Tìm topic gần nghĩa và gom sourceFolders trước khi tạo nội dung trùng.')
}
