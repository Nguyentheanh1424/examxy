import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ClassAssessmentsPage } from '@/features/assessments/pages/class-assessments-page'

const {
  useAuthMock,
  classContentApiMock,
  assessmentApiMock,
  paperExamApiMock,
} = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  classContentApiMock: {
    getClassDashboardRequest: vi.fn(),
  },
  assessmentApiMock: {
    createAssessmentRequest: vi.fn(),
    getAssessmentResultsRequest: vi.fn(),
    getClassAssessmentsRequest: vi.fn(),
    publishAssessmentRequest: vi.fn(),
    saveAssessmentAnswersRequest: vi.fn(),
    startAssessmentAttemptRequest: vi.fn(),
    submitAssessmentAttemptRequest: vi.fn(),
  },
  paperExamApiMock: {
    downloadOfflineAssessmentArtifactRequest: vi.fn(),
    finalizeOfflineAssessmentSubmissionRequest: vi.fn(),
    getAssessmentPaperBindingRequest: vi.fn(),
    getOfflineAssessmentSubmissionRequest: vi.fn(),
    getOfflineAssessmentSubmissionsRequest: vi.fn(),
    getPaperExamTemplatesRequest: vi.fn(),
    reviewOfflineAssessmentSubmissionRequest: vi.fn(),
    upsertAssessmentPaperBindingRequest: vi.fn(),
  },
}))

vi.mock('@/features/auth/auth-context', () => ({
  useAuth: () => useAuthMock(),
}))

vi.mock('@/features/class-content/lib/class-content-api', () => classContentApiMock)
vi.mock('@/features/assessments/lib/assessment-api', () => assessmentApiMock)
vi.mock('@/features/paper-exams/lib/paper-exam-api', () => paperExamApiMock)

function renderPage(path = '/classes/class-1/assessments?assessmentId=assessment-1') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<ClassAssessmentsPage />} path="/classes/:classId/assessments" />
      </Routes>
    </MemoryRouter>,
  )
}

const baseAssessment = {
  id: 'assessment-1',
  classId: 'class-1',
  title: 'Quiz 1',
  descriptionRichText: '<p>desc</p>',
  descriptionPlainText: 'desc',
  assessmentKind: 'Practice',
  status: 'Draft',
  attemptLimit: 1,
  timeLimitMinutes: 15,
  questionOrderMode: 'Fixed',
  showAnswersMode: 'Hidden',
  scoreReleaseMode: 'AfterCloseAt',
  publishAtUtc: null,
  closeAtUtc: null,
  publishedAtUtc: null,
  createdAtUtc: '2026-04-21T00:00:00.000Z',
  updatedAtUtc: '2026-04-21T00:00:00.000Z',
  items: [
    {
      id: 'item-1',
      displayOrder: 1,
      sourceQuestionId: null,
      sourceQuestionVersionId: null,
      points: 1,
      snapshotQuestionType: 'SingleChoice',
      snapshotStemRichText: '<p>2+2?</p>',
      snapshotStemPlainText: '2+2?',
      snapshotContentJson: '{"choices":["3","4"]}',
      snapshotAnswerKeyJson: '"4"',
    },
  ],
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ClassAssessmentsPage', () => {
  it('shows teacher create and publish flow', async () => {
    const user = userEvent.setup()

    useAuthMock.mockReturnValue({
      session: {
        primaryRole: 'Teacher',
        accessToken: 'teacher-token',
      },
    })
    classContentApiMock.getClassDashboardRequest.mockResolvedValue({
      className: 'Math 101',
      isTeacherOwner: true,
    })
    assessmentApiMock.getClassAssessmentsRequest.mockResolvedValue([baseAssessment])
    assessmentApiMock.createAssessmentRequest.mockResolvedValue({})
    assessmentApiMock.publishAssessmentRequest.mockResolvedValue({})
    paperExamApiMock.getPaperExamTemplatesRequest.mockResolvedValue([])
    paperExamApiMock.getAssessmentPaperBindingRequest.mockResolvedValue(null)
    paperExamApiMock.getOfflineAssessmentSubmissionsRequest.mockResolvedValue([])

    renderPage()

    await screen.findByRole('heading', { name: 'Math 101' })
    await user.type(screen.getByLabelText('Title'), 'New quiz')
    await user.click(screen.getByRole('button', { name: 'Create assessment' }))

    await waitFor(() => {
      expect(assessmentApiMock.createAssessmentRequest).toHaveBeenCalled()
    })

    await user.click(screen.getByRole('button', { name: 'Publish' }))

    await waitFor(() => {
      expect(assessmentApiMock.publishAssessmentRequest).toHaveBeenCalledWith(
        'class-1',
        'assessment-1',
        expect.objectContaining({
          showAnswersMode: 'Hidden',
        }),
      )
    })
  })

  it('supports teacher paper-exam binding, queue review, and finalize flow', async () => {
    const user = userEvent.setup()
    const draftBinding = {
      id: 'binding-1',
      assessmentId: 'assessment-1',
      templateVersionId: 'version-1',
      templateCode: 'OMR-1',
      templateVersionNumber: 1,
      bindingVersion: 1,
      configHash: 'cfg-1',
      status: 'Draft',
      answerMapJson: '[{"questionNumber":1,"assessmentItemId":"item-1"}]',
      metadataPolicyJson: '{"requireStudentId":true}',
      submissionPolicyJson: '{"allowResubmit":false}',
      reviewPolicyJson: '{"minConfidence":0.5}',
      createdAtUtc: '2026-04-21T00:00:00.000Z',
      updatedAtUtc: '2026-04-21T00:00:00.000Z',
    }
    const activeBinding = {
      ...draftBinding,
      status: 'Active',
      bindingVersion: 2,
      configHash: 'cfg-2',
    }
    const queueSubmission = {
      id: 'submission-1',
      assessmentId: 'assessment-1',
      studentUserId: 'student-1',
      bindingId: 'binding-1',
      bindingVersionUsed: 1,
      configHashUsed: 'cfg-1',
      clientSchemaVersion: '1.0',
      clientAppVersion: '1.0.0',
      rawImagePath: 'paper-scan.png',
      status: 'NeedsReview',
      createdAtUtc: '2026-04-21T00:00:00.000Z',
      updatedAtUtc: '2026-04-21T00:00:00.000Z',
      finalizedAtUtc: null,
      teacherNote: null,
      reviewedByTeacherUserId: null,
      reviewedAtUtc: null,
      result: {
        id: 'result-1',
        score: 0,
        gradedQuestionCount: 1,
        totalQuestionCount: 1,
        detectedStudentId: 'ST-001',
        detectedQuizId: 'QUIZ-1',
        confidenceSummaryJson: '{}',
        warningFlagsJson: '[]',
        conflictFlagsJson: '[]',
      },
      answers: [],
      artifacts: [],
    }
    const submissionDetail = {
      ...queueSubmission,
      answers: [
        {
          id: 'scan-answer-1',
          assessmentItemId: 'item-1',
          questionNumber: 1,
          detectedOption: 'A',
          detectedAnswerJson: '"A"',
          isCorrect: false,
          earnedPoints: 0,
          confidenceJson: '{"score":0.51}',
        },
      ],
      artifacts: [
        {
          id: 'artifact-1',
          artifactType: 'raw_image',
          storagePath: 'artifact.png',
          contentHash: 'hash-1',
        },
      ],
    }
    const reviewedSubmission = {
      ...submissionDetail,
      teacherNote: 'Checked manually',
      reviewedByTeacherUserId: 'teacher-1',
      reviewedAtUtc: '2026-04-21T01:00:00.000Z',
      answers: [
        {
          ...submissionDetail.answers[0],
          detectedOption: 'B',
          detectedAnswerJson: '"B"',
          confidenceJson: '{"score":0.95}',
        },
      ],
    }
    const finalizedSubmission = {
      ...reviewedSubmission,
      status: 'Finalized',
      finalizedAtUtc: '2026-04-21T01:15:00.000Z',
    }

    useAuthMock.mockReturnValue({
      session: {
        primaryRole: 'Teacher',
        accessToken: 'teacher-token',
      },
    })
    classContentApiMock.getClassDashboardRequest.mockResolvedValue({
      className: 'Math 101',
      isTeacherOwner: true,
    })
    assessmentApiMock.getClassAssessmentsRequest.mockResolvedValue([
      {
        ...baseAssessment,
        status: 'Published',
      },
    ])
    paperExamApiMock.getPaperExamTemplatesRequest.mockResolvedValue([
      {
        id: 'template-1',
        code: 'OMR-1',
        name: 'OMR Sheet',
        description: 'Offline exam template',
        status: 'Published',
        paperSize: 'A4',
        outputWidth: 2480,
        outputHeight: 3508,
        markerScheme: 'custom',
        hasStudentIdField: true,
        hasQuizIdField: true,
        hasHandwrittenRegions: false,
        createdAtUtc: '2026-04-20T00:00:00.000Z',
        updatedAtUtc: '2026-04-20T00:00:00.000Z',
        versions: [
          {
            id: 'version-1',
            templateId: 'template-1',
            versionNumber: 1,
            schemaVersion: '1.0',
            geometryConfigHash: 'geom-1',
            status: 'Published',
            questionCount: 1,
            optionsPerQuestion: 4,
            absThreshold: 0.7,
            relThreshold: 0.25,
            scoringMethod: 'annulus_patch_darkness',
            scoringParamsJson: '{}',
            payloadSchemaVersion: '1.0',
            minClientAppVersion: null,
            createdAtUtc: '2026-04-20T00:00:00.000Z',
            updatedAtUtc: '2026-04-20T00:00:00.000Z',
            publishedAtUtc: '2026-04-20T00:00:00.000Z',
            assets: [],
            metadataFields: [],
          },
        ],
      },
    ])
    paperExamApiMock.getAssessmentPaperBindingRequest
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(draftBinding)
      .mockResolvedValueOnce(activeBinding)
      .mockResolvedValue(activeBinding)
    paperExamApiMock.getOfflineAssessmentSubmissionsRequest.mockResolvedValue([
      queueSubmission,
    ])
    paperExamApiMock.upsertAssessmentPaperBindingRequest
      .mockResolvedValueOnce(draftBinding)
      .mockResolvedValueOnce(activeBinding)
    paperExamApiMock.getOfflineAssessmentSubmissionRequest.mockResolvedValue(
      submissionDetail,
    )
    paperExamApiMock.reviewOfflineAssessmentSubmissionRequest.mockResolvedValue(
      reviewedSubmission,
    )
    paperExamApiMock.finalizeOfflineAssessmentSubmissionRequest.mockResolvedValue(
      finalizedSubmission,
    )

    renderPage()

    await screen.findByRole('heading', { name: 'Math 101' })
    await screen.findByRole('heading', { name: 'Teacher review workspace' })
    await screen.findByRole('option', { name: 'OMR-1 - v1 (OMR Sheet)' })

    await user.selectOptions(
      screen.getByLabelText('Published template version'),
      'version-1',
    )
    await user.click(screen.getByRole('button', { name: 'Save paper binding draft' }))

    await waitFor(() => {
      expect(paperExamApiMock.upsertAssessmentPaperBindingRequest).toHaveBeenCalledWith(
        'class-1',
        'assessment-1',
        expect.objectContaining({
          activate: false,
          templateVersionId: 'version-1',
        }),
      )
    })

    await user.click(screen.getByRole('button', { name: 'Activate paper binding' }))

    await waitFor(() => {
      expect(paperExamApiMock.upsertAssessmentPaperBindingRequest).toHaveBeenCalledWith(
        'class-1',
        'assessment-1',
        expect.objectContaining({
          activate: true,
          templateVersionId: 'version-1',
        }),
      )
    })

    await user.click(screen.getByRole('button', { name: /NeedsReview/i }))

    await screen.findByDisplayValue('"A"')
    await user.clear(screen.getByLabelText('Teacher note'))
    await user.type(screen.getByLabelText('Teacher note'), 'Checked manually')
    await user.clear(screen.getByLabelText('Detected option'))
    await user.type(screen.getByLabelText('Detected option'), 'B')
    await user.clear(screen.getByLabelText('Detected answer JSON'))
    await user.type(screen.getByLabelText('Detected answer JSON'), '"B"')
    fireEvent.change(screen.getByLabelText('Confidence JSON'), {
      target: { value: '{"score":0.95}' },
    })
    await user.click(screen.getByRole('button', { name: 'Review submission' }))

    await waitFor(() => {
      expect(
        paperExamApiMock.reviewOfflineAssessmentSubmissionRequest,
      ).toHaveBeenCalledWith(
        'class-1',
        'assessment-1',
        'submission-1',
        expect.objectContaining({
          teacherNote: 'Checked manually',
          forceFinalize: false,
          overrideAnswers: [
            expect.objectContaining({
              detectedOption: 'B',
              detectedAnswerJson: '"B"',
            }),
          ],
        }),
      )
    })

    await user.click(screen.getByRole('button', { name: 'Finalize submission' }))

    await waitFor(() => {
      expect(
        paperExamApiMock.finalizeOfflineAssessmentSubmissionRequest,
      ).toHaveBeenCalledWith('class-1', 'assessment-1', 'submission-1')
    })
  })

  it('allows a student to start and submit an attempt without paper-exam actions', async () => {
    const user = userEvent.setup()

    useAuthMock.mockReturnValue({
      session: {
        primaryRole: 'Student',
        accessToken: 'student-token',
      },
    })
    classContentApiMock.getClassDashboardRequest.mockResolvedValue({
      className: 'Math 101',
      isTeacherOwner: false,
    })
    assessmentApiMock.getClassAssessmentsRequest.mockResolvedValue([
      {
        ...baseAssessment,
        status: 'Published',
      },
    ])
    assessmentApiMock.startAssessmentAttemptRequest.mockResolvedValue({
      id: 'attempt-1',
      assessmentId: 'assessment-1',
      classId: 'class-1',
      attemptNumber: 1,
      status: 'InProgress',
      startedAtUtc: '2026-04-21T00:00:00.000Z',
      submittedAtUtc: null,
      autoGradedAtUtc: null,
      timeLimitMinutesSnapshot: 15,
      maxScore: 1,
      earnedScore: 0,
      answers: [],
    })
    assessmentApiMock.saveAssessmentAnswersRequest.mockResolvedValue({
      id: 'attempt-1',
      assessmentId: 'assessment-1',
      classId: 'class-1',
      attemptNumber: 1,
      status: 'InProgress',
      startedAtUtc: '2026-04-21T00:00:00.000Z',
      submittedAtUtc: null,
      autoGradedAtUtc: null,
      timeLimitMinutesSnapshot: 15,
      maxScore: 1,
      earnedScore: 0,
      answers: [],
    })
    assessmentApiMock.submitAssessmentAttemptRequest.mockResolvedValue({
      id: 'attempt-1',
      assessmentId: 'assessment-1',
      classId: 'class-1',
      attemptNumber: 1,
      status: 'AutoGraded',
      startedAtUtc: '2026-04-21T00:00:00.000Z',
      submittedAtUtc: '2026-04-21T00:10:00.000Z',
      autoGradedAtUtc: '2026-04-21T00:10:00.000Z',
      timeLimitMinutesSnapshot: 15,
      maxScore: 1,
      earnedScore: 1,
      answers: [],
    })

    renderPage()

    await screen.findByRole('heading', { name: 'Math 101' })
    expect(screen.queryByRole('heading', { name: 'Teacher review workspace' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Start attempt' }))
    await screen.findByLabelText('Answer JSON')
    await user.type(screen.getByLabelText('Answer JSON'), '"4"')
    await user.click(screen.getByRole('button', { name: 'Save answers' }))
    await user.click(screen.getByRole('button', { name: 'Submit attempt' }))

    await waitFor(() => {
      expect(assessmentApiMock.saveAssessmentAnswersRequest).toHaveBeenCalled()
      expect(assessmentApiMock.submitAssessmentAttemptRequest).toHaveBeenCalledWith(
        'class-1',
        'attempt-1',
      )
    })
  })
})
