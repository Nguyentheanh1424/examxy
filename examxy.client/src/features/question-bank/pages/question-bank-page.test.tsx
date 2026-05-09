import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { QuestionBankPage } from '@/features/question-bank/pages/question-bank-page'
import type { Question } from '@/types/question-bank'

const { questionBankApiMock } = vi.hoisted(() => ({
  questionBankApiMock: {
    completeQuestionBankAttachmentUploadRequest: vi.fn(),
    createQuestionBankAttachmentUploadUrlRequest: vi.fn(),
    createQuestionRequest: vi.fn(),
    deleteQuestionRequest: vi.fn(),
    getQuestionBankAttachmentDownloadUrl: vi.fn(),
    getQuestionsRequest: vi.fn(),
    previewQuestionImportRequest: vi.fn(),
    updateQuestionRequest: vi.fn(),
  },
}))

vi.mock('@/features/question-bank/lib/question-bank-api', () => questionBankApiMock)

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/teacher/question-bank']}>
      <Routes>
        <Route element={<QuestionBankPage />} path="/teacher/question-bank" />
      </Routes>
    </MemoryRouter>,
  )
}

function getStemEditor(form: HTMLElement) {
  const textareas = within(form)
    .getAllByRole('textbox')
    .filter((element) => element.tagName.toLowerCase() === 'textarea')

  if (!textareas[0]) {
    throw new Error('Expected question form to include a stem textarea.')
  }

  return textareas[0]
}

function setEditorText(editor: HTMLElement, value: string) {
  fireEvent.change(editor, { target: { value } })
}

function getButtonByText(container: HTMLElement, text: string) {
  const button = within(container)
    .getAllByRole('button')
    .find((element) => element.textContent?.includes(text))

  if (!button) {
    throw new Error(`Expected button containing "${text}".`)
  }

  return button
}

const activeQuestion: Question = {
  id: 'question-1',
  code: 'QB-001',
  status: 'Active',
  currentVersionNumber: 2,
  createdAtUtc: '2026-04-20T00:00:00.000Z',
  updatedAtUtc: '2026-04-21T00:00:00.000Z',
  tags: ['Algebra', 'Functions'],
  versions: [
    {
      id: 'version-1',
      versionNumber: 1,
      questionType: 'SingleChoice',
      stemRichText: '<p>Old stem</p>',
      stemPlainText: 'Old stem',
      explanationRichText: '<p>Old explanation</p>',
      difficulty: 'Easy',
      estimatedSeconds: 45,
      contentJson: '{"choices":["A","B"]}',
      answerKeyJson: '"A"',
      attachments: [],
    },
    {
      id: 'version-2',
      versionNumber: 2,
      questionType: 'SingleChoice',
      stemRichText: '<p>Linear function question</p>',
      stemPlainText: 'Linear function question',
      explanationRichText: '<p>Use the slope-intercept form.</p>',
      difficulty: 'Medium',
      estimatedSeconds: 60,
      contentJson: '{invalid-json',
      answerKeyJson: '"A"',
      attachments: [
        {
          id: 'attachment-1',
          fileName: 'graph.png',
          contentType: 'image/png',
          fileSizeBytes: 1200,
          externalUrl: 'https://example.test/graph.png',
        },
      ],
    },
  ],
}

const archivedQuestion: Question = {
  id: 'question-2',
  code: 'QB-002',
  status: 'Archived',
  currentVersionNumber: 1,
  createdAtUtc: '2026-04-18T00:00:00.000Z',
  updatedAtUtc: '2026-04-19T00:00:00.000Z',
  tags: ['Geometry'],
  versions: [
    {
      id: 'version-3',
      versionNumber: 1,
      questionType: 'Matching',
      stemRichText: '<p>Archived theorem question</p>',
      stemPlainText: 'Archived theorem question',
      explanationRichText: '<p>Archived explanation</p>',
      difficulty: 'Hard',
      estimatedSeconds: 90,
      contentJson: '{"pairs":[{"left":"A","right":"1"},{"left":"B","right":"2"}]}',
      answerKeyJson: '{"A":"1","B":"2"}',
      attachments: [],
    },
  ],
}

beforeEach(() => {
  vi.clearAllMocks()
  if (!URL.createObjectURL) {
    URL.createObjectURL = vi.fn(() => 'blob:question-image')
  }
  questionBankApiMock.getQuestionsRequest.mockResolvedValue([
    activeQuestion,
    archivedQuestion,
  ])
  questionBankApiMock.createQuestionRequest.mockResolvedValue(activeQuestion)
  questionBankApiMock.createQuestionBankAttachmentUploadUrlRequest.mockResolvedValue({
    attachmentId: 'attachment-upload-1',
    uploadUrl: '/api/question-bank/attachments/complete',
    method: 'POST',
    headers: {},
    attachment: {
      id: 'attachment-upload-1',
      fileName: 'graph.png',
      contentType: 'image/png',
      fileSizeBytes: 8,
      externalUrl: '',
      status: 'PendingUpload',
    },
  })
  questionBankApiMock.completeQuestionBankAttachmentUploadRequest.mockResolvedValue({
    id: 'attachment-upload-1',
    fileName: 'graph.png',
    contentType: 'image/png',
    fileSizeBytes: 8,
    externalUrl: '',
    status: 'Uploaded',
  })
  questionBankApiMock.getQuestionBankAttachmentDownloadUrl.mockReturnValue('/api/question-bank/attachments/attachment-upload-1/download')
  questionBankApiMock.previewQuestionImportRequest.mockResolvedValue({
    status: 'Parsed',
    questionType: 'SingleChoice',
    draft: {
      authoringMode: 'Rich',
      questionType: 'SingleChoice',
      stemPlainText: 'Imported stem',
      stemRichText: '<p>Imported stem</p>',
      stemText: 'Imported stem',
      stem: {
        schemaVersion: 2,
        blocks: [
          {
            type: 'paragraph',
            inline: [{ type: 'text', text: 'Imported stem' }],
          },
        ],
      },
      choices: [
        {
          id: 'A',
          text: '1',
          content: { schemaVersion: 2, blocks: [{ type: 'paragraph', inline: [{ type: 'text', text: '1' }] }] },
          isCorrect: false,
        },
        {
          id: 'B',
          text: '2',
          content: { schemaVersion: 2, blocks: [{ type: 'paragraph', inline: [{ type: 'text', text: '2' }] }] },
          isCorrect: true,
        },
      ],
      answerKey: {
        correctChoiceIds: ['B'],
      },
      explanationRichText: '<p>Imported explanation</p>',
      explanation: {
        schemaVersion: 2,
        blocks: [
          {
            type: 'paragraph',
            inline: [{ type: 'text', text: 'Imported explanation' }],
          },
        ],
      },
      difficulty: 'Medium',
      estimatedSeconds: 60,
      contentJson: '{"schemaVersion":2,"questionType":"SingleChoice","stem":{"schemaVersion":2,"blocks":[]},"metadata":{"difficulty":"Medium","estimatedSeconds":60},"choices":[{"id":"A","content":{"schemaVersion":2,"blocks":[]}},{"id":"B","content":{"schemaVersion":2,"blocks":[]}}],"leftItems":[],"rightItems":[],"items":[],"media":[]}',
      answerKeyJson: '{"correctChoiceIds":["B"]}',
      tags: [],
      attachments: [],
    },
    warnings: [],
    errors: [],
  })
  questionBankApiMock.updateQuestionRequest.mockResolvedValue(activeQuestion)
  questionBankApiMock.deleteQuestionRequest.mockResolvedValue(undefined)
})

describe('QuestionBankPage', () => {
  it('keeps refresh in the question list toolbar instead of page actions', async () => {
    const user = userEvent.setup()

    renderPage()

    await screen.findByText('Linear function question')

    const pageActions = screen.getByRole('navigation', { name: 'Ngân hàng câu hỏi page actions' })
    expect(within(pageActions).getByRole('button', { name: 'Tạo câu hỏi' })).toBeInTheDocument()
    expect(within(pageActions).getByRole('link', { name: 'Quay lại bảng điều khiển' })).toBeInTheDocument()
    expect(within(pageActions).queryByRole('button', { name: 'Refresh' })).not.toBeInTheDocument()

    const questionList = screen.getByRole('region', { name: 'Danh sách câu hỏi' })
    await user.click(within(questionList).getByRole('button', { name: 'Làm mới' }))

    await waitFor(() => {
      expect(questionBankApiMock.getQuestionsRequest).toHaveBeenCalledTimes(2)
    })
  })

  it('renders loaded questions and filters by status tabs', async () => {
    const user = userEvent.setup()

    renderPage()

    expect(await screen.findByText('Linear function question')).toBeInTheDocument()
    expect(screen.queryByText('Archived theorem question')).not.toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: /Archived/ }))

    expect(await screen.findByText('Archived theorem question')).toBeInTheDocument()
    expect(screen.queryByText('Linear function question')).not.toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: /All/ }))

    expect(screen.getByText('Linear function question')).toBeInTheDocument()
    expect(screen.getByText('Archived theorem question')).toBeInTheDocument()
  })

  it('searches local question data and shows a no-results state', async () => {
    const user = userEvent.setup()

    renderPage()

    await screen.findByText('Linear function question')
    await user.type(screen.getByLabelText('Tìm kiếm câu hỏi'), 'Functions')

    expect(screen.getByText('Linear function question')).toBeInTheDocument()

    await user.clear(screen.getByLabelText('Tìm kiếm câu hỏi'))
    await user.type(screen.getByLabelText('Tìm kiếm câu hỏi'), 'not-present')

    expect(screen.getByText('Không có câu hỏi phù hợp')).toBeInTheDocument()
  })

  it('filters local question data by type and difficulty', async () => {
    const user = userEvent.setup()

    renderPage()

    await screen.findByText('Linear function question')
    await user.click(screen.getByRole('tab', { name: /All/ }))

    await user.click(screen.getByRole('button', { name: 'Loại' }))
    await user.click(screen.getByRole('button', { name: 'Ghép đôi' }))

    expect(screen.queryByText('Linear function question')).not.toBeInTheDocument()
    expect(screen.getByText('Archived theorem question')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Xóa bộ lọc' }))
    await user.click(screen.getByRole('button', { name: 'Độ khó' }))
    await user.click(screen.getByRole('button', { name: 'Medium' }))

    expect(screen.getByText('Linear function question')).toBeInTheDocument()
    expect(screen.queryByText('Archived theorem question')).not.toBeInTheDocument()
  })

  it('opens a preview panel and handles invalid JSON without crashing', async () => {
    const user = userEvent.setup()

    renderPage()

    await screen.findByText('Linear function question')
    await user.click(screen.getAllByRole('button', { name: 'Xem trước' })[0])

    expect(screen.getByText('graph.png')).toBeInTheDocument()
    expect(screen.getByText((content) => content.includes('dữ liệu câu hỏi'))).toBeInTheDocument()
    await user.click(getButtonByText(document.body, 'Chi'))
    await user.click(getButtonByText(document.body, 'Nội dung'))
    expect(screen.getByText((content) => content.includes('JSON không hợp lệ'))).toBeInTheDocument()
    expect(screen.getByText('Use the slope-intercept form.')).toBeInTheDocument()
  })

  it('creates a single-choice question while generating JSON automatically', async () => {
    const user = userEvent.setup()

    renderPage()

    await screen.findByText('Linear function question')
    await user.click(screen.getByRole('button', { name: 'Tạo câu hỏi' }))
    const form = screen.getByRole('form', { name: 'Tạo câu hỏi' })

    const stemEditor = getStemEditor(form)
    await user.clear(stemEditor)
    setEditorText(stemEditor, 'New reusable question')
    await user.click(within(form).getByRole('button', { name: 'Thông tin bổ sung' }))
    await user.click(within(form).getByRole('button', { name: /Chọn thẻ phân loại/ }))
    await user.click(screen.getByRole('button', { name: 'Algebra' }))
    await user.click(within(form).getByRole('button', { name: 'Tạo câu hỏi' }))

    await waitFor(() => {
      expect(questionBankApiMock.createQuestionRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          stemPlainText: 'New reusable question',
          stemRichText: '<p>New reusable question</p>',
          authoringMode: 'Rich',
          questionType: 'SingleChoice',
          stem: expect.objectContaining({
            schemaVersion: 2,
          }),
          choices: expect.arrayContaining([
            expect.objectContaining({
              id: 'A',
              content: expect.objectContaining({ schemaVersion: 2 }),
              isCorrect: true,
            }),
          ]),
          answerKey: {
            correctChoiceIds: ['A'],
          },
          difficulty: 'Medium',
          estimatedSeconds: 60,
          contentJson: expect.stringContaining('"choices"'),
          answerKeyJson: '{"correctChoiceIds":["A"]}',
          tags: ['Algebra'],
          attachments: [],
        }),
      )
    })
  })

  it('creates a question with inline math in stem, choices, and explanation', async () => {
    const user = userEvent.setup()

    renderPage()

    await screen.findByText('Linear function question')
    await user.click(screen.getByRole('button', { name: 'Tạo câu hỏi' }))
    const form = screen.getByRole('form', { name: 'Tạo câu hỏi' })

    setEditorText(
      getStemEditor(form),
      'Tính đạo hàm của \\(f(x)=x^2+1\\) tại x = 2.',
    )
    setEditorText(within(form).getByLabelText('Lựa chọn 1'), '\\(2x\\)')
    setEditorText(within(form).getByLabelText('Lựa chọn 2'), '\\(4\\)')
    setEditorText(
      within(form).getByLabelText('Lời giải'),
      'Ta có \\(f\\prime(x)=2x\\), nên \\(f\\prime(2)=4\\).',
    )
    await user.click(within(form).getByRole('button', { name: 'Tạo câu hỏi' }))

    await waitFor(() => {
      expect(questionBankApiMock.createQuestionRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          stem: expect.objectContaining({
            blocks: expect.arrayContaining([
              expect.objectContaining({
                inline: expect.arrayContaining([
                  expect.objectContaining({ type: 'mathInline', latex: 'f(x)=x^2+1' }),
                ]),
              }),
            ]),
          }),
          choices: expect.arrayContaining([
            expect.objectContaining({
              id: 'A',
              content: expect.objectContaining({
                blocks: expect.arrayContaining([
                  expect.objectContaining({
                    inline: [expect.objectContaining({ type: 'mathInline', latex: '2x' })],
                  }),
                ]),
              }),
            }),
          ]),
          explanation: expect.objectContaining({
            blocks: expect.arrayContaining([
              expect.objectContaining({
                inline: expect.arrayContaining([
                  expect.objectContaining({ type: 'mathInline', latex: 'f\\prime(x)=2x' }),
                  expect.objectContaining({ type: 'mathInline', latex: 'f\\prime(2)=4' }),
                ]),
              }),
            ]),
          }),
        }),
      )
    })
  })

  it('previews a single imported question, keeps metadata, and saves through create', async () => {
    const user = userEvent.setup()

    renderPage()

    await screen.findByText('Linear function question')
    await user.click(screen.getByRole('button', { name: 'Tạo câu hỏi' }))
    const form = screen.getByRole('form', { name: 'Tạo câu hỏi' })
    await user.click(within(form).getByRole('button', { name: 'Thông tin bổ sung' }))
    const difficultyField = within(form).getByLabelText('Độ khó')
    const estimatedSecondsField = within(form).getByRole('spinbutton')

    await user.clear(difficultyField)
    await user.type(difficultyField, 'Hard')
    await user.clear(estimatedSecondsField)
    await user.type(estimatedSecondsField, '90')
    await user.click(within(form).getByRole('button', { name: /Chọn thẻ phân loại/ }))
    await user.click(screen.getByRole('button', { name: 'Algebra' }))

    await user.click(screen.getByRole('tab', { name: 'Nhập từ LaTeX/text' }))
    await user.type(
      screen.getByLabelText('Nội dung LaTeX/text của một câu'),
      'Câu 1. Tính \\\\(1+1\\\\)?\nA. 1\nB. 2\nĐáp án: B',
    )
    await user.click(screen.getByRole('button', { name: 'Phân tích nội dung' }))

    await waitFor(() => {
      expect(questionBankApiMock.previewQuestionImportRequest).toHaveBeenCalledWith({
        questionType: 'SingleChoice',
        sourceFormat: 'LatexText',
        rawText: 'Câu 1. Tính \\\\(1+1\\\\)?\nA. 1\nB. 2\nĐáp án: B',
      })
    })

    expect(getStemEditor(form)).toHaveValue('Imported stem')
    expect(screen.getByText('Đã phân tích')).toBeInTheDocument()
    expect(screen.getByText('Đã đổ nội dung vào form bên dưới')).toBeInTheDocument()
    expect(screen.getAllByText('Nội dung câu hỏi').length).toBeGreaterThan(0)
    expect(screen.getByText('Lựa chọn')).toBeInTheDocument()
    expect(screen.getAllByText('Lời giải').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Imported explanation').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Đáp án đúng').length).toBeGreaterThan(0)
    expect(screen.getAllByDisplayValue('2').length).toBeGreaterThan(0)

    await user.click(within(form).getByRole('button', { name: 'Tạo câu hỏi' }))

    await waitFor(() => {
      expect(questionBankApiMock.createQuestionRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          stemPlainText: 'Imported stem',
          questionType: 'SingleChoice',
          difficulty: 'Hard',
          estimatedSeconds: 90,
          tags: ['Algebra'],
          answerKey: {
            correctChoiceIds: ['B'],
          },
        }),
      )
    })
  })

  it('shows a friendly import error without filling the editor', async () => {
    const user = userEvent.setup()

    renderPage()

    await screen.findByText('Linear function question')
    await user.click(screen.getByRole('button', { name: 'Tạo câu hỏi' }))
    await user.click(screen.getByRole('tab', { name: 'Nhập từ LaTeX/text' }))
    await user.click(screen.getByRole('button', { name: 'Phân tích nội dung' }))

    expect(screen.getByText('Chưa phân tích được')).toBeInTheDocument()
    expect(screen.getByText('Vui lòng nhập nội dung câu hỏi.')).toBeInTheDocument()
    expect(questionBankApiMock.previewQuestionImportRequest).not.toHaveBeenCalled()

    const form = screen.getByRole('form', { name: 'Tạo câu hỏi' })
    expect(getStemEditor(form)).toHaveValue('')
  })

  it('creates a multiple-choice question without exposing JSON inputs', async () => {
    const user = userEvent.setup()

    renderPage()

    await screen.findByText('Linear function question')
    await user.click(screen.getByRole('button', { name: 'Tạo câu hỏi' }))
    const form = screen.getByRole('form', { name: 'Tạo câu hỏi' })

    expect(within(form).queryByLabelText('Nội dung JSON')).not.toBeInTheDocument()
    expect(within(form).queryByLabelText('Đáp án JSON')).not.toBeInTheDocument()

    await user.click(getButtonByText(form, 'Nhi'))
    const stemEditor = getStemEditor(form)
    await user.clear(stemEditor)
    setEditorText(stemEditor, 'Choose all valid answers')
    await user.click(within(form).getByRole('button', { name: 'Tạo câu hỏi' }))

    await waitFor(() => {
      expect(questionBankApiMock.createQuestionRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          stemPlainText: 'Choose all valid answers',
          authoringMode: 'Rich',
          questionType: 'MultipleChoice',
          choices: expect.arrayContaining([
            expect.objectContaining({
              id: 'A',
              isCorrect: true,
            }),
          ]),
          answerKey: {
            correctChoiceIds: ['A'],
          },
          contentJson: expect.stringContaining('"choices"'),
          answerKeyJson: '["A"]',
        }),
      )
    })
  })

  it('shows friendly save validation for missing required question fields', async () => {
    const user = userEvent.setup()

    renderPage()

    await screen.findByText('Linear function question')
    await user.click(screen.getByRole('button', { name: 'Tạo câu hỏi' }))
    const form = screen.getByRole('form', { name: 'Tạo câu hỏi' })

    await user.click(within(form).getByRole('button', { name: 'Tạo câu hỏi' }))

    expect(screen.getAllByText('Vui lòng nhập nội dung câu hỏi.').length).toBeGreaterThan(0)
    expect(questionBankApiMock.createQuestionRequest).not.toHaveBeenCalled()

    const stemEditor = getStemEditor(form)
    setEditorText(stemEditor, 'Question needs choices')
    await user.clear(within(form).getByLabelText('Lựa chọn 1'))
    await user.clear(within(form).getByLabelText('Lựa chọn 2'))
    await user.click(within(form).getByRole('button', { name: 'Tạo câu hỏi' }))

    expect(screen.getAllByText('Cần ít nhất 2 lựa chọn để tạo câu hỏi.').length).toBeGreaterThan(0)
    expect(questionBankApiMock.createQuestionRequest).not.toHaveBeenCalled()
  })

  it('requires an editable correct answer before saving multiple choice', async () => {
    const user = userEvent.setup()

    renderPage()

    await screen.findByText('Linear function question')
    await user.click(screen.getByRole('button', { name: 'Tạo câu hỏi' }))
    const form = screen.getByRole('form', { name: 'Tạo câu hỏi' })

    await user.click(getButtonByText(form, 'Nhi'))
    setEditorText(getStemEditor(form), 'Question needs at least one correct answer')
    await user.click(within(form).getAllByRole('button', { name: 'Đáp án đúng' })[0])
    await user.click(within(form).getByRole('button', { name: 'Tạo câu hỏi' }))

    expect(screen.getAllByText('Chọn ít nhất một đáp án đúng trước khi lưu.').length).toBeGreaterThan(0)
    expect(questionBankApiMock.createQuestionRequest).not.toHaveBeenCalled()
  })

  it('creates a true-false question with an editable answer', async () => {
    const user = userEvent.setup()

    renderPage()

    await screen.findByText('Linear function question')
    await user.click(screen.getByRole('button', { name: 'Tạo câu hỏi' }))
    const form = screen.getByRole('form', { name: 'Tạo câu hỏi' })

    await user.click(getButtonByText(form, 'Sai'))
    setEditorText(getStemEditor(form), 'The number 2 is odd.')
    await user.click(within(form).getByRole('button', { name: 'Sai' }))
    expect(screen.getAllByText('Đáp án đúng hiện chọn').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Sai').length).toBeGreaterThan(0)
    await user.click(within(form).getByRole('button', { name: 'Tạo câu hỏi' }))

    await waitFor(() => {
      expect(questionBankApiMock.createQuestionRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          stemPlainText: 'The number 2 is odd.',
          questionType: 'TrueFalse',
          answerKey: {
            value: false,
          },
          answerKeyJson: 'false',
        }),
      )
    })
  })

  it('creates a matching question using BE left/right item and match shape', async () => {
    const user = userEvent.setup()

    renderPage()

    await screen.findByText('Linear function question')
    await user.click(screen.getByRole('button', { name: 'Tạo câu hỏi' }))
    const form = screen.getByRole('form', { name: 'Tạo câu hỏi' })

    await user.click(getButtonByText(form, 'Ghép đôi'))
    setEditorText(getStemEditor(form), 'Match each function with its value')
    await user.click(within(form).getByRole('button', { name: 'Tạo câu hỏi' }))

    await waitFor(() => {
      expect(questionBankApiMock.createQuestionRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          questionType: 'Matching',
          leftItems: [
            expect.objectContaining({ id: 'L1', text: 'A' }),
            expect.objectContaining({ id: 'L2', text: 'B' }),
          ],
          rightItems: [
            expect.objectContaining({ id: 'R1', text: '1' }),
            expect.objectContaining({ id: 'R2', text: '2' }),
          ],
          answerKey: {
            matches: [
              { leftId: 'L1', rightId: 'R1' },
              { leftId: 'L2', rightId: 'R2' },
            ],
          },
        }),
      )
    })
  })

  it('creates an ordering question using BE ordered item ids', async () => {
    const user = userEvent.setup()

    renderPage()

    await screen.findByText('Linear function question')
    await user.click(screen.getByRole('button', { name: 'Tạo câu hỏi' }))
    const form = screen.getByRole('form', { name: 'Tạo câu hỏi' })

    await user.click(getButtonByText(form, 'Sắp xếp'))
    setEditorText(getStemEditor(form), 'Put these steps in order')
    await user.click(within(form).getByRole('button', { name: 'Tạo câu hỏi' }))

    await waitFor(() => {
      expect(questionBankApiMock.createQuestionRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          questionType: 'Ordering',
          items: [
            expect.objectContaining({ id: 'I1' }),
            expect.objectContaining({ id: 'I2' }),
          ],
          answerKey: {
            orderedItemIds: ['I1', 'I2'],
          },
        }),
      )
    })
  })

  it('creates a media-based question as manual grading content', async () => {
    const user = userEvent.setup()

    renderPage()

    await screen.findByText('Linear function question')
    await user.click(screen.getByRole('button', { name: 'Tạo câu hỏi' }))
    const form = screen.getByRole('form', { name: 'Tạo câu hỏi' })

    await user.click(getButtonByText(form, 'Câu hỏi dùng media'))
    setEditorText(getStemEditor(form), 'Analyze the attached diagram')
    await user.type(
      within(form).getByLabelText('Tài liệu / media cần xem'),
      'Student explains the diagram relationships.',
    )
    await user.click(within(form).getByRole('button', { name: 'Tạo câu hỏi' }))

    await waitFor(() => {
      expect(questionBankApiMock.createQuestionRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          questionType: 'MediaBased',
          answerKey: {
            gradingMode: 'Manual',
          },
          media: [],
        }),
      )
    })
  })

  it('uploads an image and saves it as a canonical stem image block', async () => {
    const user = userEvent.setup()

    renderPage()

    await screen.findByText('Linear function question')
    await user.click(screen.getByRole('button', { name: 'Tạo câu hỏi' }))
    const form = screen.getByRole('form', { name: 'Tạo câu hỏi' })
    const file = new File([new Uint8Array([137, 80, 78, 71])], 'graph.png', {
      type: 'image/png',
    })
    await user.upload(within(form).getByLabelText('Tải ảnh'), file)

    await waitFor(() => {
      expect(questionBankApiMock.createQuestionBankAttachmentUploadUrlRequest).toHaveBeenCalledWith({
        fileName: 'graph.png',
        contentType: 'image/png',
        fileSizeBytes: 4,
      })
    })
    expect(questionBankApiMock.completeQuestionBankAttachmentUploadRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        attachmentId: 'attachment-upload-1',
      }),
    )
    expect(await within(form).findByText('graph.png')).toBeInTheDocument()

    const stemEditor = getStemEditor(form)
    await user.clear(stemEditor)
    setEditorText(stemEditor, 'Question with image')
    await user.click(within(form).getByRole('button', { name: 'Tạo câu hỏi' }))

    await waitFor(() => {
      expect(questionBankApiMock.createQuestionRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          stem: expect.objectContaining({
            blocks: expect.arrayContaining([
              expect.objectContaining({
                type: 'image',
                attachmentId: 'attachment-upload-1',
              }),
            ]),
          }),
        }),
      )
    })
  })

  it('updates a question while preserving status', async () => {
    const user = userEvent.setup()

    renderPage()

    await screen.findByText('Linear function question')
    await user.click(screen.getAllByRole('button', { name: 'Xem trước' })[0])
    await user.click(getButtonByText(document.body, 'S'))

    const form = screen.getByRole('form')
    const stemEditor = getStemEditor(form)
    await user.clear(stemEditor)
    setEditorText(stemEditor, 'Updated linear function')
    await user.click(getButtonByText(form, 'L'))

    await waitFor(() => {
      expect(questionBankApiMock.updateQuestionRequest).toHaveBeenCalledWith(
        'question-1',
        expect.objectContaining({
          stemPlainText: 'Updated linear function',
          stemRichText: '<p>Updated linear function</p>',
          status: 'Active',
        }),
      )
    })
  })

  it('deletes a question through the existing delete API', async () => {
    const user = userEvent.setup()

    renderPage()

    await screen.findByText('Linear function question')
    await user.click(screen.getByRole('button', { name: 'Thêm thao tác cho QB-001' }))
    await user.click(screen.getByRole('button', { name: 'Xóa' }))
    await user.click(screen.getByRole('button', { name: 'Lưu trữ câu hỏi' }))

    await waitFor(() => {
      expect(questionBankApiMock.deleteQuestionRequest).toHaveBeenCalledWith('question-1')
    })
  })
})
