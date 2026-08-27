import { StrictMode } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { KnowledgeTopic } from '../../domain/knowledge/KnowledgeTopic'
import { KnowledgeLibraryPage } from './KnowledgeLibraryPage'

const topic: KnowledgeTopic = {
  id: 'sample',
  title: 'Chủ đề mẫu',
  navTitle: 'Mẫu',
  eyebrow: 'Kiểm thử',
  description: 'Nội dung dùng để kiểm tra giao diện.',
  order: 1,
  icon: 'flask',
  accent: 'mint',
  level: 'Nền tảng',
  estimatedMinutes: 5,
  tags: ['test'],
  sourceFolders: ['Sample'],
  outcomes: ['Một', 'Hai', 'Ba'],
  contentFolder: 'sample',
  questions: [
    {
      id: 'sample-001',
      question: 'Đáp án nào đúng?',
      options: ['Đúng', 'Sai một', 'Sai hai', 'Sai ba'],
      answerIndex: 0,
      explanation: 'Đây là đáp án được dùng để kiểm tra luồng Q&A.',
      difficulty: 'Cơ bản',
      source: 'Sample/README.md',
    },
  ],
  content:
    '## Tổng `quan`\n\nĐây là nội dung chính.\n\n## Tổng **quan**\n\nKhông trùng anchor.\n\n## Checklist\n\n- Hoàn thành',
}

const sourceCoverage = {
  totalSourceFiles: 0,
  totalUniqueDocuments: 0,
  totalWords: 0,
  totalRawWords: 0,
  documents: [],
} as const

const coverageWithSource = {
  totalSourceFiles: 1,
  totalUniqueDocuments: 1,
  totalWords: 12,
  totalRawWords: 12,
  documents: [
    {
      id: 'sample-source',
      topicId: 'sample',
      title: 'Tài liệu mẫu',
      sourcePaths: ['Sample/README.md'],
      assetPath: 'knowledge-sources/sample/sample-source.md',
      wordCount: 12,
      lineCount: 4,
      isAggregate: false,
    },
  ],
} as const

const emptySourceLoader = async () => ''

describe('KnowledgeLibraryPage', () => {
  it('render nội dung, anchor duy nhất và search dùng được bằng bàn phím', async () => {
    Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true })
    window.history.replaceState(null, '', '/#%E0%A4%A')
    render(
      <StrictMode>
        <KnowledgeLibraryPage
          topics={[topic]}
          sourceCoverage={sourceCoverage}
          loadSourceContent={emptySourceLoader}
        />
      </StrictMode>,
    )

    expect(screen.getByRole('heading', { level: 1, name: topic.title })).toBeVisible()
    expect(screen.getAllByRole('tab', { name: /Mẫu/i }).length).toBeGreaterThan(0)
    const repeatedHeadings = screen.getAllByRole('heading', {
      level: 2,
      name: 'Tổng quan',
    })
    expect(repeatedHeadings.map((heading) => heading.id)).toEqual([
      'tong-quan',
      'tong-quan-1',
    ])
    expect(screen.getByRole('button', { name: /Đánh dấu đã học/i })).toBeEnabled()

    const search = screen.getByRole('combobox', {
      name: 'Tìm trong toàn bộ kiến thức',
    })
    fireEvent.focus(search)
    fireEvent.change(search, { target: { value: 'test' } })
    expect(screen.getByRole('listbox', { name: 'Kết quả tìm kiếm' })).toBeVisible()
    fireEvent.keyDown(search, { key: 'Enter' })
    await waitFor(() => expect(document.activeElement).toBe(search))
  })

  it('cho phép làm bài Q&A và xem giải thích', () => {
    window.history.replaceState(null, '', '/')
    render(
      <KnowledgeLibraryPage
        topics={[topic]}
        sourceCoverage={sourceCoverage}
        loadSourceContent={emptySourceLoader}
      />,
    )

    fireEvent.click(screen.getByRole('tab', { name: /Kiểm tra Q&A/i }))
    fireEvent.click(screen.getByRole('radio', { name: /Đúng/i }))
    expect(screen.getByText('Chính xác')).toBeVisible()
    expect(screen.getByText(/kiểm tra luồng Q&A/i)).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: /Xem kết quả/i }))
    expect(screen.getByRole('heading', { name: '100%' })).toBeVisible()
  })

  it('đổi chế độ học bằng phím mũi tên theo chuẩn tablist', () => {
    render(
      <KnowledgeLibraryPage
        topics={[topic]}
        sourceCoverage={sourceCoverage}
        loadSourceContent={emptySourceLoader}
      />,
    )
    const summaryTab = screen.getByRole('tab', { name: 'Tóm tắt' })
    const sourceTab = screen.getByRole('tab', {
      name: /Tài liệu chi tiết/i,
    })
    expect(summaryTab).toHaveAttribute(
      'aria-controls',
      'learning-mode-panel-summary',
    )
    expect(sourceTab).toHaveAttribute(
      'aria-controls',
      'learning-mode-panel-sources',
    )
    summaryTab.focus()
    fireEvent.keyDown(summaryTab, { key: 'ArrowRight' })
    expect(sourceTab).toHaveAttribute('aria-selected', 'true')
    expect(document.getElementById('learning-mode-panel-summary')).toHaveAttribute(
      'hidden',
    )
    expect(document.getElementById('learning-mode-panel-sources')).not.toHaveAttribute(
      'hidden',
    )
  })

  it('giữ nguyên tiến độ Q&A khi chuyển qua lại giữa các chế độ học', () => {
    render(
      <KnowledgeLibraryPage
        topics={[topic]}
        sourceCoverage={sourceCoverage}
        loadSourceContent={emptySourceLoader}
      />,
    )

    const quizTab = screen.getByRole('tab', { name: /Kiểm tra Q&A/i })
    expect(quizTab).toHaveAttribute(
      'aria-controls',
      'learning-mode-panel-quiz',
    )
    fireEvent.click(quizTab)
    const correctAnswer = screen.getByRole('radio', { name: /Đúng$/i })
    fireEvent.click(correctAnswer)
    expect(screen.getByText('Chính xác')).toBeVisible()
    expect(screen.getByText('Đúng hiện tại: 1/1')).toBeVisible()

    fireEvent.click(screen.getByRole('tab', { name: 'Tóm tắt' }))
    expect(document.getElementById('learning-mode-panel-quiz')).toHaveAttribute(
      'hidden',
    )
    fireEvent.click(quizTab)

    expect(screen.getByText('Chính xác')).toBeVisible()
    expect(screen.getByText('Đúng hiện tại: 1/1')).toBeVisible()
    expect(correctAnswer).toBeChecked()
  })

  it('chỉ tải Markdown chi tiết khi người học mở tài liệu nguồn', async () => {
    const sourceLoader = vi
      .fn()
      .mockResolvedValue(
        '# Chi tiết nguồn\n\n[Đi tới heading](#chi-tiết-nguồn)\n\nNội dung Markdown nguyên bản.',
      )
    render(
      <KnowledgeLibraryPage
        topics={[topic]}
        sourceCoverage={coverageWithSource}
        loadSourceContent={sourceLoader}
      />,
    )

    expect(sourceLoader).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('tab', { name: /Tài liệu chi tiết/i }))
    expect(
      await screen.findByRole('heading', { name: 'Chi tiết nguồn', level: 1 }),
    ).toBeVisible()
    expect(sourceLoader).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'sample-source' }),
      expect.any(AbortSignal),
    )
    expect(screen.getByRole('link', { name: 'Đi tới heading' })).toHaveAttribute(
      'href',
      '#chi-tiet-nguon',
    )

    const sourceSearch = screen.getByRole('searchbox', {
      name: 'Tìm trong tài liệu của chủ đề',
    })
    fireEvent.change(sourceSearch, { target: { value: 'README' } })
    fireEvent.click(screen.getByRole('tab', { name: 'Tóm tắt' }))
    fireEvent.click(screen.getByRole('tab', { name: /Tài liệu chi tiết/i }))
    expect(sourceSearch).toHaveValue('README')
    expect(sourceLoader).toHaveBeenCalledTimes(1)
  })
})
