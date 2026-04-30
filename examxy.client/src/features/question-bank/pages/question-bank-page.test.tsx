import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { QuestionBankPage } from '@/features/question-bank/pages/question-bank-page'
import type { Question } from '@/types/question-bank'

const { questionBankApiMock } = vi.hoisted(() => ({
  questionBankApiMock: {
    createQuestionRequest: vi.fn(),
    deleteQuestionRequest: vi.fn(),
    getQuestionsRequest: vi.fn(),
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
      questionType: 'ShortAnswer',
      stemRichText: '<p>Archived theorem question</p>',
      stemPlainText: 'Archived theorem question',
      explanationRichText: '<p>Archived explanation</p>',
      difficulty: 'Hard',
      estimatedSeconds: 90,
      contentJson: '{}',
      answerKeyJson: '"proof"',
      attachments: [],
    },
  ],
}

beforeEach(() => {
  vi.clearAllMocks()
  questionBankApiMock.getQuestionsRequest.mockResolvedValue([
    activeQuestion,
    archivedQuestion,
  ])
  questionBankApiMock.createQuestionRequest.mockResolvedValue(activeQuestion)
  questionBankApiMock.updateQuestionRequest.mockResolvedValue(activeQuestion)
  questionBankApiMock.deleteQuestionRequest.mockResolvedValue(undefined)
})

describe('QuestionBankPage', () => {
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
    await user.type(screen.getByLabelText('Search questions'), 'Functions')

    expect(screen.getByText('Linear function question')).toBeInTheDocument()

    await user.clear(screen.getByLabelText('Search questions'))
    await user.type(screen.getByLabelText('Search questions'), 'not-present')

    expect(screen.getByText('No matching questions')).toBeInTheDocument()
  })

  it('opens a preview panel and handles invalid JSON without crashing', async () => {
    const user = userEvent.setup()

    renderPage()

    await screen.findByText('Linear function question')
    await user.click(screen.getAllByRole('button', { name: 'Preview' })[0])

    expect(screen.getByText('graph.png')).toBeInTheDocument()
    expect(screen.getByText('Invalid JSON. Showing the saved raw value.')).toBeInTheDocument()
    expect(screen.getByText('Use the slope-intercept form.')).toBeInTheDocument()
  })

  it('creates a question with the existing payload shape', async () => {
    const user = userEvent.setup()

    renderPage()

    await screen.findByText('Linear function question')
    const form = screen.getByRole('form', { name: 'Create question' })

    await user.clear(within(form).getByLabelText('Stem'))
    await user.type(within(form).getByLabelText('Stem'), 'New reusable question')
    await user.clear(within(form).getByLabelText('Tags (comma separated)'))
    await user.type(within(form).getByLabelText('Tags (comma separated)'), 'Algebra, Quiz')
    await user.click(within(form).getByRole('button', { name: 'Create question' }))

    await waitFor(() => {
      expect(questionBankApiMock.createQuestionRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          stemPlainText: 'New reusable question',
          stemRichText: '<p>New reusable question</p>',
          questionType: 'SingleChoice',
          difficulty: 'Medium',
          estimatedSeconds: 60,
          contentJson: '{"choices":["A","B"]}',
          answerKeyJson: '"A"',
          tags: ['Algebra', 'Quiz'],
          attachments: [],
        }),
      )
    })
  })

  it('updates a question while preserving status', async () => {
    const user = userEvent.setup()

    renderPage()

    await screen.findByText('Linear function question')
    await user.click(screen.getAllByRole('button', { name: 'Preview' })[0])
    await user.click(screen.getByRole('button', { name: 'Edit question' }))

    const form = screen.getByRole('form', { name: 'Edit current question' })
    await user.clear(within(form).getByLabelText('Stem'))
    await user.type(within(form).getByLabelText('Stem'), 'Updated linear function')
    await user.click(within(form).getByRole('button', { name: 'Save new version' }))

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
    await user.click(screen.getAllByRole('button', { name: 'Delete' })[0])

    await waitFor(() => {
      expect(questionBankApiMock.deleteQuestionRequest).toHaveBeenCalledWith('question-1')
    })
  })
})
