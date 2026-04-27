import type { FormEvent, ReactNode, SelectHTMLAttributes } from 'react'
import {
  BookCheck,
  ClipboardCheck,
  Download,
  Eye,
  FileSearch,
  RefreshCcw,
  Rocket,
} from 'lucide-react'
import { useEffect, useId, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { CardShell } from '@/components/ui/card-shell'
import { Notice } from '@/components/ui/notice'
import { Spinner } from '@/components/ui/spinner'
import { TextField } from '@/components/ui/text-field'
import { TextareaField } from '@/components/ui/textarea-field'
import { useAuth } from '@/features/auth/auth-context'
import {
  createAssessmentRequest,
  getAssessmentResultsRequest,
  getClassAssessmentsRequest,
  publishAssessmentRequest,
  saveAssessmentAnswersRequest,
  startAssessmentAttemptRequest,
  submitAssessmentAttemptRequest,
} from '@/features/assessments/lib/assessment-api'
import { getClassDashboardRequest } from '@/features/class-content/lib/class-content-api'
import {
  downloadOfflineAssessmentArtifactRequest,
  finalizeOfflineAssessmentSubmissionRequest,
  getAssessmentPaperBindingRequest,
  getOfflineAssessmentSubmissionRequest,
  getOfflineAssessmentSubmissionsRequest,
  getPaperExamTemplatesRequest,
  reviewOfflineAssessmentSubmissionRequest,
  upsertAssessmentPaperBindingRequest,
} from '@/features/paper-exams/lib/paper-exam-api'
import { getErrorMessage } from '@/lib/http/api-error'
import type {
  Assessment,
  CreateAssessmentRequest,
  PublishAssessmentRequest,
  StudentAssessmentAttempt,
} from '@/types/assessment'
import type {
  AssessmentPaperBinding,
  AssessmentPaperBindingMapItem,
  AssessmentScanSubmission,
  OfflineRecognizedAnswer,
  PaperExamTemplate,
  PaperExamTemplateVersion,
} from '@/types/paper-exam'

interface DraftAssessmentFormState {
  title: string
  description: string
  assessmentKind: string
  attemptLimit: string
  timeLimitMinutes: string
  showAnswersMode: string
  scoreReleaseMode: string
  itemsJson: string
}

interface BindingAnswerMapDraftState {
  questionNumber: string
  assessmentItemId: string
}

interface BindingDraftState {
  templateVersionId: string
  metadataPolicyJson: string
  submissionPolicyJson: string
  reviewPolicyJson: string
  answerMap: BindingAnswerMapDraftState[]
}

interface ReviewAnswerDraftState {
  questionNumber: number
  assessmentItemId: string
  detectedOption: string
  detectedAnswerJson: string
  confidenceJson: string
}

interface ReviewDraftState {
  teacherNote: string
  overrideAnswers: ReviewAnswerDraftState[]
}

interface PublishedTemplateVersionOption {
  templateCode: string
  templateName: string
  version: PaperExamTemplateVersion
}

interface SelectFieldProps
  extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  hint?: string
  labelAction?: ReactNode
}

const emptyDraft: DraftAssessmentFormState = {
  title: '',
  description: '',
  assessmentKind: 'Practice',
  attemptLimit: '1',
  timeLimitMinutes: '',
  showAnswersMode: 'Hidden',
  scoreReleaseMode: 'AfterCloseAt',
  itemsJson: JSON.stringify(
    [
      {
        displayOrder: 1,
        sourceQuestionId: null,
        sourceQuestionVersionId: null,
        points: 1,
        snapshotQuestionType: 'SingleChoice',
        snapshotStemRichText: '<p>Example question</p>',
        snapshotStemPlainText: 'Example question',
        snapshotContentJson: '{"choices":["A","B"]}',
        snapshotAnswerKeyJson: '"A"',
      },
    ],
    null,
    2,
  ),
}

const emptyBindingDraft: BindingDraftState = {
  templateVersionId: '',
  metadataPolicyJson: '{}',
  submissionPolicyJson: '{}',
  reviewPolicyJson: '{}',
  answerMap: [],
}

const emptyReviewDraft: ReviewDraftState = {
  teacherNote: '',
  overrideAnswers: [],
}

function SelectField({
  children,
  className,
  hint,
  id,
  label,
  labelAction,
  ...props
}: SelectFieldProps) {
  const generatedId = useId()
  const selectId = id ?? generatedId
  const hintId = hint ? `${selectId}-hint` : undefined

  return (
    <div className={className}>
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label
            className="block text-base font-medium tracking-[0.01em] text-ink"
            htmlFor={selectId}
          >
            {label}
          </label>
          {labelAction ? <div className="shrink-0">{labelAction}</div> : null}
        </div>
        <select
          {...props}
          className="min-h-11 w-full rounded-[var(--radius-input)] border border-line bg-surface px-4 py-3 text-base text-ink outline-none transition hover:border-brand/25 focus:border-brand focus:ring-4 focus:ring-focus/25"
          id={selectId}
        >
          {children}
        </select>
        {hint ? (
          <p className="text-base leading-relaxed text-muted" id={hintId}>
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  )
}

function formatUtcDate(value: string | null) {
  if (!value) return 'Not scheduled'
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function toCreateAssessmentRequest(
  state: DraftAssessmentFormState,
): CreateAssessmentRequest {
  const description = state.description.trim()

  return {
    title: state.title.trim(),
    descriptionPlainText: description,
    descriptionRichText: `<p>${description}</p>`,
    assessmentKind: state.assessmentKind.trim() || 'Practice',
    attemptLimit: Number(state.attemptLimit) || 1,
    timeLimitMinutes: state.timeLimitMinutes ? Number(state.timeLimitMinutes) : null,
    questionOrderMode: 'Fixed',
    showAnswersMode: state.showAnswersMode,
    scoreReleaseMode: state.scoreReleaseMode,
    publishAtUtc: null,
    closeAtUtc: null,
    items: JSON.parse(state.itemsJson) as CreateAssessmentRequest['items'],
  }
}

function createDefaultAnswerMap(
  questionCount: number,
  assessment: Assessment,
  currentRows: BindingAnswerMapDraftState[] = [],
) {
  return Array.from({ length: questionCount }, (_, index) => {
    const questionNumber = index + 1
    const existing = currentRows.find(
      (row) => Number(row.questionNumber) === questionNumber,
    )
    const fallbackItem = assessment.items[index]?.id ?? assessment.items[0]?.id ?? ''

    return {
      questionNumber: String(questionNumber),
      assessmentItemId: existing?.assessmentItemId ?? fallbackItem,
    }
  })
}

function parseBindingAnswerMap(
  answerMapJson: string,
): AssessmentPaperBindingMapItem[] {
  try {
    const parsed = JSON.parse(answerMapJson) as AssessmentPaperBindingMapItem[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function createBindingDraftState(
  assessment: Assessment,
  binding: AssessmentPaperBinding | null,
  publishedVersions: PublishedTemplateVersionOption[],
) {
  const selectedVersionId =
    binding?.templateVersionId ?? publishedVersions[0]?.version.id ?? ''
  const selectedVersion = publishedVersions.find(
    (candidate) => candidate.version.id === selectedVersionId,
  )?.version

  const bindingRows = binding
    ? parseBindingAnswerMap(binding.answerMapJson).map((item) => ({
        questionNumber: String(item.questionNumber),
        assessmentItemId: item.assessmentItemId,
      }))
    : []

  return {
    templateVersionId: selectedVersionId,
    metadataPolicyJson: binding?.metadataPolicyJson ?? '{}',
    submissionPolicyJson: binding?.submissionPolicyJson ?? '{}',
    reviewPolicyJson: binding?.reviewPolicyJson ?? '{}',
    answerMap: createDefaultAnswerMap(
      selectedVersion?.questionCount ?? bindingRows.length,
      assessment,
      bindingRows,
    ),
  }
}

function createReviewDraftState(submission: AssessmentScanSubmission): ReviewDraftState {
  return {
    teacherNote: submission.teacherNote ?? '',
    overrideAnswers: submission.answers.map((answer) => ({
      questionNumber: answer.questionNumber,
      assessmentItemId: answer.assessmentItemId,
      detectedOption: answer.detectedOption,
      detectedAnswerJson: answer.detectedAnswerJson,
      confidenceJson: answer.confidenceJson,
    })),
  }
}

function hasReviewDraftChanges(
  submission: AssessmentScanSubmission,
  reviewDraft: ReviewDraftState,
) {
  const normalizedTeacherNote = reviewDraft.teacherNote.trim()
  if ((submission.teacherNote ?? '') !== normalizedTeacherNote) {
    return true
  }

  if (submission.answers.length !== reviewDraft.overrideAnswers.length) {
    return true
  }

  return reviewDraft.overrideAnswers.some((answerDraft) => {
    const currentAnswer = submission.answers.find(
      (candidate) => candidate.questionNumber === answerDraft.questionNumber,
    )

    if (!currentAnswer) {
      return true
    }

    return (
      currentAnswer.detectedOption !== answerDraft.detectedOption ||
      currentAnswer.detectedAnswerJson !== answerDraft.detectedAnswerJson ||
      currentAnswer.confidenceJson !== answerDraft.confidenceJson
    )
  })
}

export function ClassAssessmentsPage() {
  const { classId = '' } = useParams()
  const { session } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [resultsByAssessmentId, setResultsByAssessmentId] = useState<
    Record<string, StudentAssessmentAttempt[]>
  >({})
  const [attemptByAssessmentId, setAttemptByAssessmentId] = useState<
    Record<string, StudentAssessmentAttempt | null>
  >({})
  const [answerDraftByItemId, setAnswerDraftByItemId] = useState<
    Record<string, string>
  >({})
  const [className, setClassName] = useState<string>('')
  const [isTeacherOwner, setIsTeacherOwner] = useState(false)
  const [paperTemplates, setPaperTemplates] = useState<PaperExamTemplate[]>([])
  const [paperBinding, setPaperBinding] = useState<AssessmentPaperBinding | null>(null)
  const [bindingDraft, setBindingDraft] = useState<BindingDraftState>(emptyBindingDraft)
  const [paperSubmissions, setPaperSubmissions] = useState<AssessmentScanSubmission[]>(
    [],
  )
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(
    null,
  )
  const [selectedSubmission, setSelectedSubmission] =
    useState<AssessmentScanSubmission | null>(null)
  const [reviewDraft, setReviewDraft] = useState<ReviewDraftState>(emptyReviewDraft)
  const [isLoading, setIsLoading] = useState(true)
  const [isPaperLoading, setIsPaperLoading] = useState(false)
  const [isSubmissionLoading, setIsSubmissionLoading] = useState(false)
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<{
    tone: 'error' | 'success'
    title: string
    message: string
  } | null>(null)
  const [draft, setDraft] = useState<DraftAssessmentFormState>(emptyDraft)

  const selectedAssessmentId = searchParams.get('assessmentId')

  const selectedAssessment = useMemo(
    () =>
      assessments.find((assessment) => assessment.id === selectedAssessmentId) ??
      assessments[0] ??
      null,
    [assessments, selectedAssessmentId],
  )

  const publishedTemplateVersions = useMemo<PublishedTemplateVersionOption[]>(
    () =>
      paperTemplates.flatMap((template) =>
        template.versions
          .filter((version) => version.status === 'Published')
          .map((version) => ({
            templateCode: template.code,
            templateName: template.name,
            version,
          })),
      ),
    [paperTemplates],
  )

  const selectedPaperTemplateVersion = useMemo(
    () =>
      publishedTemplateVersions.find(
        (candidate) => candidate.version.id === bindingDraft.templateVersionId,
      ) ?? null,
    [bindingDraft.templateVersionId, publishedTemplateVersions],
  )

  async function loadData() {
    const [dashboard, assessmentItems] = await Promise.all([
      getClassDashboardRequest(classId),
      getClassAssessmentsRequest(classId),
    ])

    setClassName(dashboard.className)
    setIsTeacherOwner(
      Boolean(session?.primaryRole === 'Teacher' && dashboard.isTeacherOwner),
    )
    setAssessments(assessmentItems)
  }

  async function refreshAssessments() {
    try {
      await loadData()
    } catch (nextError) {
      setNotice({
        tone: 'error',
        title: 'Refresh failed',
        message: getErrorMessage(nextError, 'Unable to refresh assessments.'),
      })
    }
  }

  async function refreshPaperTemplates() {
    if (!isTeacherOwner) {
      return
    }

    const templates = await getPaperExamTemplatesRequest()
    setPaperTemplates(templates)
  }

  async function refreshPaperExamState(
    assessment: Assessment,
    preferredSubmissionId: string | null = selectedSubmissionId,
  ) {
    if (!isTeacherOwner) {
      return
    }

    setIsPaperLoading(true)

    try {
      const [binding, submissions] = await Promise.all([
        getAssessmentPaperBindingRequest(classId, assessment.id),
        getOfflineAssessmentSubmissionsRequest(classId, assessment.id),
      ])

      setPaperBinding(binding)
      setPaperSubmissions(submissions)

      if (preferredSubmissionId && submissions.some((item) => item.id === preferredSubmissionId)) {
        setSelectedSubmissionId(preferredSubmissionId)
      } else {
        setSelectedSubmissionId(null)
        setSelectedSubmission(null)
        setReviewDraft(emptyReviewDraft)
      }
    } finally {
      setIsPaperLoading(false)
    }
  }

  useEffect(() => {
    if (!classId) {
      setError('Missing class id in route.')
      setIsLoading(false)
      return
    }

    void (async () => {
      setError(null)

      try {
        await loadData()
      } catch (nextError) {
        setError(getErrorMessage(nextError, 'Unable to load assessments.'))
      } finally {
        setIsLoading(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId])

  useEffect(() => {
    if (!isTeacherOwner) {
      setPaperTemplates([])
      return
    }

    void (async () => {
      try {
        await refreshPaperTemplates()
      } catch (nextError) {
        setNotice({
          tone: 'error',
          title: 'Unable to load paper templates',
          message: getErrorMessage(
            nextError,
            'Published paper-exam templates are unavailable right now.',
          ),
        })
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTeacherOwner])

  useEffect(() => {
    if (!selectedAssessmentId && assessments[0]) {
      const nextParams = new URLSearchParams(searchParams)
      nextParams.set('assessmentId', assessments[0].id)
      setSearchParams(nextParams, { replace: true })
    }
  }, [assessments, searchParams, selectedAssessmentId, setSearchParams])

  useEffect(() => {
    if (!isTeacherOwner || !selectedAssessment) {
      setPaperBinding(null)
      setBindingDraft(emptyBindingDraft)
      setPaperSubmissions([])
      setSelectedSubmissionId(null)
      setSelectedSubmission(null)
      setReviewDraft(emptyReviewDraft)
      return
    }

    void (async () => {
      try {
        await refreshPaperExamState(selectedAssessment, null)
      } catch (nextError) {
        setNotice({
          tone: 'error',
          title: 'Unable to load paper exam state',
          message: getErrorMessage(
            nextError,
            'The paper-exam binding or submission queue could not be loaded.',
          ),
        })
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, isTeacherOwner, selectedAssessment?.id])

  useEffect(() => {
    if (!isTeacherOwner || !selectedAssessment) {
      return
    }

    setBindingDraft(
      createBindingDraftState(selectedAssessment, paperBinding, publishedTemplateVersions),
    )
  }, [isTeacherOwner, paperBinding, publishedTemplateVersions, selectedAssessment])

  useEffect(() => {
    if (!isTeacherOwner || !selectedAssessment || !selectedSubmissionId) {
      setSelectedSubmission(null)
      setReviewDraft(emptyReviewDraft)
      return
    }

    void (async () => {
      setIsSubmissionLoading(true)

      try {
        const submission = await getOfflineAssessmentSubmissionRequest(
          classId,
          selectedAssessment.id,
          selectedSubmissionId,
        )
        setSelectedSubmission(submission)
        setReviewDraft(createReviewDraftState(submission))
      } catch (nextError) {
        setNotice({
          tone: 'error',
          title: 'Unable to load submission detail',
          message: getErrorMessage(
            nextError,
            'The selected paper-exam submission could not be loaded.',
          ),
        })
      } finally {
        setIsSubmissionLoading(false)
      }
    })()
  }, [classId, isTeacherOwner, selectedAssessment, selectedSubmissionId])

  async function handleCreateAssessment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusyKey('create-assessment')
    setNotice(null)

    try {
      await createAssessmentRequest(classId, toCreateAssessmentRequest(draft))
      setDraft(emptyDraft)
      await refreshAssessments()
      setNotice({
        tone: 'success',
        title: 'Assessment created',
        message: 'The new draft assessment is now available in this class.',
      })
    } catch (nextError) {
      setNotice({
        tone: 'error',
        title: 'Unable to create assessment',
        message: getErrorMessage(nextError, 'Check the assessment payload and try again.'),
      })
    } finally {
      setBusyKey(null)
    }
  }

  async function handlePublish(assessment: Assessment) {
    setBusyKey(`publish-${assessment.id}`)
    setNotice(null)

    try {
      const request: PublishAssessmentRequest = {
        publishAtUtc: assessment.publishAtUtc,
        closeAtUtc: assessment.closeAtUtc,
        showAnswersMode: assessment.showAnswersMode,
        scoreReleaseMode: assessment.scoreReleaseMode,
      }

      await publishAssessmentRequest(classId, assessment.id, request)
      await refreshAssessments()
      setNotice({
        tone: 'success',
        title: 'Assessment published',
        message: 'Students can now see the assessment according to its schedule.',
      })
    } catch (nextError) {
      setNotice({
        tone: 'error',
        title: 'Unable to publish assessment',
        message: getErrorMessage(nextError, 'The assessment could not be published.'),
      })
    } finally {
      setBusyKey(null)
    }
  }

  async function handleLoadResults(assessmentId: string) {
    setBusyKey(`results-${assessmentId}`)
    setNotice(null)

    try {
      const results = await getAssessmentResultsRequest(classId, assessmentId)
      setResultsByAssessmentId((current) => ({
        ...current,
        [assessmentId]: results,
      }))
    } catch (nextError) {
      setNotice({
        tone: 'error',
        title: 'Unable to load results',
        message: getErrorMessage(
          nextError,
          'Assessment results are unavailable right now.',
        ),
      })
    } finally {
      setBusyKey(null)
    }
  }

  async function handleStartAttempt(assessmentId: string) {
    setBusyKey(`attempt-${assessmentId}`)
    setNotice(null)

    try {
      const attempt = await startAssessmentAttemptRequest(classId, assessmentId)
      setAttemptByAssessmentId((current) => ({
        ...current,
        [assessmentId]: attempt,
      }))
      setNotice({
        tone: 'success',
        title: 'Attempt started',
        message: 'Answer drafts are now unlocked for this assessment.',
      })
    } catch (nextError) {
      setNotice({
        tone: 'error',
        title: 'Unable to start attempt',
        message: getErrorMessage(nextError, 'The attempt could not be created.'),
      })
    } finally {
      setBusyKey(null)
    }
  }

  async function handleSaveAnswers(assessment: Assessment) {
    const activeAttempt = attemptByAssessmentId[assessment.id]
    if (!activeAttempt) return

    setBusyKey(`save-${assessment.id}`)
    setNotice(null)

    try {
      const response = await saveAssessmentAnswersRequest(classId, activeAttempt.id, {
        items: assessment.items.map((item) => ({
          assessmentItemId: item.id,
          questionType: item.snapshotQuestionType,
          answerJson: answerDraftByItemId[item.id] ?? 'null',
        })),
      })

      setAttemptByAssessmentId((current) => ({
        ...current,
        [assessment.id]: response,
      }))
      setNotice({
        tone: 'success',
        title: 'Answers saved',
        message: 'The latest answer payload has been stored for this attempt.',
      })
    } catch (nextError) {
      setNotice({
        tone: 'error',
        title: 'Unable to save answers',
        message: getErrorMessage(nextError, 'The attempt answers could not be saved.'),
      })
    } finally {
      setBusyKey(null)
    }
  }

  async function handleSubmitAttempt(assessmentId: string) {
    const activeAttempt = attemptByAssessmentId[assessmentId]
    if (!activeAttempt) return

    setBusyKey(`submit-${assessmentId}`)
    setNotice(null)

    try {
      const response = await submitAssessmentAttemptRequest(classId, activeAttempt.id)
      setAttemptByAssessmentId((current) => ({
        ...current,
        [assessmentId]: response,
      }))
      setNotice({
        tone: 'success',
        title: 'Attempt submitted',
        message:
          'The attempt has been submitted and graded according to the current policy.',
      })
    } catch (nextError) {
      setNotice({
        tone: 'error',
        title: 'Unable to submit attempt',
        message: getErrorMessage(nextError, 'The attempt could not be submitted.'),
      })
    } finally {
      setBusyKey(null)
    }
  }

  async function handleSaveBinding(activate: boolean) {
    if (!selectedAssessment) {
      return
    }

    if (!bindingDraft.templateVersionId) {
      setNotice({
        tone: 'error',
        title: 'Select a template version',
        message: 'Choose a published template version before saving the paper binding.',
      })
      return
    }

    setBusyKey(activate ? 'activate-paper-binding' : 'save-paper-binding')
    setNotice(null)

    try {
      const answerMap = bindingDraft.answerMap
        .map<AssessmentPaperBindingMapItem | null>((row) => {
          const questionNumber = Number(row.questionNumber)

          if (!questionNumber || !row.assessmentItemId) {
            return null
          }

          return {
            questionNumber,
            assessmentItemId: row.assessmentItemId,
          }
        })
        .filter((row): row is AssessmentPaperBindingMapItem => row !== null)

      const response = await upsertAssessmentPaperBindingRequest(
        classId,
        selectedAssessment.id,
        {
          templateVersionId: bindingDraft.templateVersionId,
          answerMap,
          metadataPolicyJson: bindingDraft.metadataPolicyJson || '{}',
          submissionPolicyJson: bindingDraft.submissionPolicyJson || '{}',
          reviewPolicyJson: bindingDraft.reviewPolicyJson || '{}',
          activate,
        },
      )

      setPaperBinding(response)
      await refreshPaperExamState(selectedAssessment, selectedSubmissionId)
      setNotice({
        tone: 'success',
        title: activate ? 'Paper binding activated' : 'Paper binding saved',
        message: activate
          ? 'The assessment now uses the selected paper template version.'
          : 'The binding draft was saved without activating it yet.',
      })
    } catch (nextError) {
      setNotice({
        tone: 'error',
        title: 'Unable to save paper binding',
        message: getErrorMessage(
          nextError,
          'The paper binding could not be updated.',
        ),
      })
    } finally {
      setBusyKey(null)
    }
  }

  async function handleReviewSubmission(forceFinalize: boolean) {
    if (!selectedAssessment || !selectedSubmission) {
      return
    }

    setBusyKey(forceFinalize ? 'finalize-paper-submission' : 'review-paper-submission')
    setNotice(null)

    try {
      const shouldFinalizeDirectly =
        forceFinalize && !hasReviewDraftChanges(selectedSubmission, reviewDraft)

      const response = shouldFinalizeDirectly
        ? await finalizeOfflineAssessmentSubmissionRequest(
            classId,
            selectedAssessment.id,
            selectedSubmission.id,
          )
        : await reviewOfflineAssessmentSubmissionRequest(
            classId,
            selectedAssessment.id,
            selectedSubmission.id,
            {
              teacherNote: reviewDraft.teacherNote.trim() || null,
              forceFinalize,
              overrideAnswers: reviewDraft.overrideAnswers.map<OfflineRecognizedAnswer>(
                (answer) => ({
                  questionNumber: answer.questionNumber,
                  detectedOption: answer.detectedOption,
                  detectedAnswerJson: answer.detectedAnswerJson,
                  confidenceJson: answer.confidenceJson,
                }),
              ),
            },
          )

      setSelectedSubmission(response)
      setReviewDraft(createReviewDraftState(response))
      await refreshPaperExamState(selectedAssessment, response.id)
      setNotice({
        tone: 'success',
        title: forceFinalize ? 'Submission finalized' : 'Submission reviewed',
        message: forceFinalize
          ? 'The paper-exam submission is now finalized.'
          : 'Teacher review changes were saved.',
      })
    } catch (nextError) {
      setNotice({
        tone: 'error',
        title: forceFinalize
          ? 'Unable to finalize submission'
          : 'Unable to review submission',
        message: getErrorMessage(
          nextError,
          'The paper-exam review could not be completed.',
        ),
      })
    } finally {
      setBusyKey(null)
    }
  }

  async function handleDownloadArtifact(artifactId: string) {
    if (!selectedAssessment || !selectedSubmission || !session?.accessToken) {
      return
    }

    setBusyKey(`download-artifact-${artifactId}`)
    setNotice(null)

    try {
      await downloadOfflineAssessmentArtifactRequest(
        session.accessToken,
        classId,
        selectedAssessment.id,
        selectedSubmission.id,
        artifactId,
      )
    } catch (nextError) {
      setNotice({
        tone: 'error',
        title: 'Unable to download artifact',
        message: getErrorMessage(
          nextError,
          'The review artifact could not be downloaded.',
        ),
      })
    } finally {
      setBusyKey(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-full border border-line bg-surface px-5 py-3 text-sm font-medium text-muted shadow-sm">
          <Spinner />
          Loading assessments...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Notice tone="error" title="Unable to load assessments">
        {error}
      </Notice>
    )
  }

  return (
    <div className="space-y-6">
      <CardShell className="p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-strong">
              Class assessments
            </p>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-4xl">
                {className || 'Assessment workspace'}
              </h1>
              <p className="max-w-3xl text-base leading-7 text-muted">
                Manage draft and published assessments, or run the student attempt
                flow with the current class-scoped API contract.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to={`/classes/${classId}`}>
              <Button variant="secondary">Back to class</Button>
            </Link>
            <Button
              leftIcon={<RefreshCcw className="size-4" />}
              onClick={() => {
                void refreshAssessments()
                if (selectedAssessment && isTeacherOwner) {
                  void refreshPaperTemplates()
                  void refreshPaperExamState(selectedAssessment)
                }
              }}
              variant="secondary"
            >
              Refresh
            </Button>
          </div>
        </div>
      </CardShell>

      {notice ? (
        <Notice tone={notice.tone} title={notice.title}>
          {notice.message}
        </Notice>
      ) : null}

      {isTeacherOwner ? (
        <CardShell className="p-6 sm:p-8">
          <form className="space-y-4" onSubmit={handleCreateAssessment}>
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-strong">
                Teacher flow
              </p>
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-ink">
                Create draft assessment
              </h2>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <TextField
                label="Title"
                onChange={(event) =>
                  setDraft((current) => ({ ...current, title: event.target.value }))
                }
                value={draft.title}
              />
              <TextField
                label="Assessment kind"
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    assessmentKind: event.target.value,
                  }))
                }
                value={draft.assessmentKind}
              />
              <TextField
                label="Attempt limit"
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    attemptLimit: event.target.value,
                  }))
                }
                type="number"
                value={draft.attemptLimit}
              />
              <TextField
                label="Time limit minutes"
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    timeLimitMinutes: event.target.value,
                  }))
                }
                type="number"
                value={draft.timeLimitMinutes}
              />
              <TextField
                label="Show answers mode"
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    showAnswersMode: event.target.value,
                  }))
                }
                value={draft.showAnswersMode}
              />
              <TextField
                label="Score release mode"
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    scoreReleaseMode: event.target.value,
                  }))
                }
                value={draft.scoreReleaseMode}
              />
            </div>

            <TextareaField
              label="Description"
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              rows={3}
              value={draft.description}
            />

            <TextareaField
              label="Assessment items JSON"
              onChange={(event) =>
                setDraft((current) => ({ ...current, itemsJson: event.target.value }))
              }
              rows={10}
              value={draft.itemsJson}
            />

            <Button
              isLoading={busyKey === 'create-assessment'}
              leftIcon={<Rocket className="size-4" />}
              type="submit"
            >
              Create assessment
            </Button>
          </form>
        </CardShell>
      ) : null}

      <div className="space-y-4">
        {assessments.length === 0 ? (
          <CardShell className="p-6 sm:p-8">
            <p className="text-base leading-7 text-muted">
              No assessments exist for this class yet.
            </p>
          </CardShell>
        ) : null}

        {assessments.map((assessment) => {
          const activeAttempt = attemptByAssessmentId[assessment.id]
          const results = resultsByAssessmentId[assessment.id]
          const isSelected = selectedAssessment?.id === assessment.id

          return (
            <CardShell className="p-6" key={assessment.id}>
              <div className="space-y-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-strong">
                        {assessment.status}
                      </span>
                      {isSelected ? (
                        <span className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-muted">
                          Focused
                        </span>
                      ) : null}
                    </div>

                    <h2 className="text-2xl font-semibold tracking-[-0.03em] text-ink">
                      {assessment.title}
                    </h2>
                    <p className="text-sm leading-6 text-muted">
                      {assessment.descriptionPlainText || 'No description.'}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-3xl border border-line bg-surface p-4">
                      <p className="text-sm font-semibold text-ink">Schedule</p>
                      <p className="mt-2 text-sm leading-6 text-muted">
                        Publish {formatUtcDate(assessment.publishAtUtc)}
                        <br />
                        Close {formatUtcDate(assessment.closeAtUtc)}
                      </p>
                    </div>
                    <div className="rounded-3xl border border-line bg-surface p-4">
                      <p className="text-sm font-semibold text-ink">Rules</p>
                      <p className="mt-2 text-sm leading-6 text-muted">
                        Attempt limit {assessment.attemptLimit}
                        <br />
                        Time limit {assessment.timeLimitMinutes ?? 'None'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-line bg-panel p-4">
                  <p className="text-sm font-semibold text-ink">
                    Items ({assessment.items.length})
                  </p>
                  <div className="mt-3 space-y-3">
                    {assessment.items.map((item) => (
                      <div className="rounded-2xl border border-line bg-surface p-4" key={item.id}>
                        <p className="text-sm font-semibold text-ink">
                          #{item.displayOrder} - {item.snapshotQuestionType} - {item.points} pts
                        </p>
                        <p className="mt-2 text-sm leading-6 text-muted">
                          {item.snapshotStemPlainText}
                        </p>
                        {!isTeacherOwner && activeAttempt && activeAttempt.status === 'InProgress' ? (
                          <TextareaField
                            label="Answer JSON"
                            onChange={(event) => {
                              setAnswerDraftByItemId((current) => ({
                                ...current,
                                [item.id]: event.target.value,
                              }))
                            }}
                            rows={3}
                            value={answerDraftByItemId[item.id] ?? ''}
                          />
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() => {
                      const nextParams = new URLSearchParams(searchParams)
                      nextParams.set('assessmentId', assessment.id)
                      setSearchParams(nextParams)
                    }}
                    variant={isSelected ? 'secondary' : 'ghost'}
                  >
                    {isSelected ? 'Focused assessment' : 'Focus assessment'}
                  </Button>

                  {isTeacherOwner ? (
                    <>
                      {assessment.status !== 'Published' ? (
                        <Button
                          isLoading={busyKey === `publish-${assessment.id}`}
                          leftIcon={<Rocket className="size-4" />}
                          onClick={() => {
                            void handlePublish(assessment)
                          }}
                        >
                          Publish
                        </Button>
                      ) : null}
                      <Button
                        isLoading={busyKey === `results-${assessment.id}`}
                        leftIcon={<Eye className="size-4" />}
                        onClick={() => {
                          void handleLoadResults(assessment.id)
                        }}
                        variant="secondary"
                      >
                        View results
                      </Button>
                    </>
                  ) : (
                    <>
                      {!activeAttempt ? (
                        <Button
                          isLoading={busyKey === `attempt-${assessment.id}`}
                          leftIcon={<BookCheck className="size-4" />}
                          onClick={() => {
                            void handleStartAttempt(assessment.id)
                          }}
                        >
                          Start attempt
                        </Button>
                      ) : null}

                      {activeAttempt?.status === 'InProgress' ? (
                        <>
                          <Button
                            isLoading={busyKey === `save-${assessment.id}`}
                            onClick={() => {
                              void handleSaveAnswers(assessment)
                            }}
                            variant="secondary"
                          >
                            Save answers
                          </Button>
                          <Button
                            isLoading={busyKey === `submit-${assessment.id}`}
                            leftIcon={<ClipboardCheck className="size-4" />}
                            onClick={() => {
                              void handleSubmitAttempt(assessment.id)
                            }}
                          >
                            Submit attempt
                          </Button>
                        </>
                      ) : null}
                    </>
                  )}
                </div>

                {activeAttempt ? (
                  <div className="rounded-3xl border border-line bg-surface p-4">
                    <p className="text-sm font-semibold text-ink">Current attempt</p>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      Attempt #{activeAttempt.attemptNumber} - {activeAttempt.status}
                      <br />
                      Score {activeAttempt.earnedScore} / {activeAttempt.maxScore}
                    </p>
                  </div>
                ) : null}

                {results ? (
                  <div className="rounded-3xl border border-line bg-surface p-4">
                    <p className="text-sm font-semibold text-ink">
                      Teacher results ({results.length})
                    </p>
                    <div className="mt-3 space-y-3">
                      {results.map((result) => (
                        <div className="rounded-2xl border border-line bg-panel p-4" key={result.id}>
                          <p className="text-sm font-semibold text-ink">
                            Attempt #{result.attemptNumber} - {result.status}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-muted">
                            Started {formatUtcDate(result.startedAtUtc)}
                            <br />
                            Submitted {formatUtcDate(result.submittedAtUtc)}
                            <br />
                            Score {result.earnedScore} / {result.maxScore}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {isTeacherOwner && isSelected ? (
                  <div className="space-y-4 rounded-3xl border border-line bg-panel p-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-strong">
                          Paper exam
                        </p>
                        <h3 className="text-2xl font-semibold tracking-[-0.03em] text-ink">
                          Teacher review workspace
                        </h3>
                      </div>
                      <Link to="/teacher/paper-exams">
                        <Button variant="secondary">Open template workspace</Button>
                      </Link>
                    </div>

                    {isPaperLoading ? (
                      <div className="flex items-center gap-3 rounded-3xl border border-line bg-surface px-4 py-3 text-sm text-muted">
                        <Spinner />
                        Loading paper binding and submissions...
                      </div>
                    ) : null}

                    <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                      <div className="space-y-4 rounded-3xl border border-line bg-surface p-4">
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-ink">1. Binding setup</p>
                          <p className="text-sm leading-6 text-muted">
                            Choose a published paper template version, map question
                            numbers, and save the draft or activate it for this
                            assessment.
                          </p>
                        </div>

                        <SelectField
                          hint={
                            publishedTemplateVersions.length === 0
                              ? 'Create and publish a paper template version first.'
                              : undefined
                          }
                          label="Published template version"
                          onChange={(event) => {
                            const nextVersionId = event.target.value
                            const nextVersion = publishedTemplateVersions.find(
                              (candidate) => candidate.version.id === nextVersionId,
                            )?.version

                            setBindingDraft((current) => ({
                              ...current,
                              templateVersionId: nextVersionId,
                              answerMap: createDefaultAnswerMap(
                                nextVersion?.questionCount ?? 0,
                                assessment,
                                current.answerMap,
                              ),
                            }))
                          }}
                          value={bindingDraft.templateVersionId}
                        >
                          <option value="">Select a published version</option>
                          {publishedTemplateVersions.map((candidate) => (
                            <option key={candidate.version.id} value={candidate.version.id}>
                              {candidate.templateCode} - v{candidate.version.versionNumber} (
                              {candidate.templateName})
                            </option>
                          ))}
                        </SelectField>

                        {paperBinding ? (
                          <div className="rounded-3xl border border-line bg-panel p-4 text-sm leading-6 text-muted">
                            Current binding status: <strong>{paperBinding.status}</strong>
                            <br />
                            Config hash: {paperBinding.configHash}
                          </div>
                        ) : null}

                        {selectedPaperTemplateVersion ? (
                          <div className="rounded-3xl border border-line bg-panel p-4 text-sm leading-6 text-muted">
                            Template {selectedPaperTemplateVersion.templateCode} version{' '}
                            {selectedPaperTemplateVersion.version.versionNumber}
                            <br />
                            Questions {selectedPaperTemplateVersion.version.questionCount} -
                            Options {selectedPaperTemplateVersion.version.optionsPerQuestion}
                          </div>
                        ) : null}

                        <div className="space-y-3">
                          <p className="text-sm font-semibold text-ink">Answer map</p>
                          {bindingDraft.answerMap.length === 0 ? (
                            <p className="text-sm leading-6 text-muted">
                              Select a published template version to generate the
                              question-number mapping.
                            </p>
                          ) : (
                            bindingDraft.answerMap.map((row, rowIndex) => (
                              <div
                                className="grid gap-3 rounded-3xl border border-line bg-panel p-4 lg:grid-cols-[140px_1fr]"
                                key={`answer-map-${row.questionNumber}`}
                              >
                                <TextField
                                  disabled
                                  label="Question number"
                                  value={row.questionNumber}
                                />
                                <SelectField
                                  label="Assessment item"
                                  onChange={(event) => {
                                    setBindingDraft((current) => ({
                                      ...current,
                                      answerMap: current.answerMap.map(
                                        (candidate, candidateIndex) =>
                                          candidateIndex === rowIndex
                                            ? {
                                                ...candidate,
                                                assessmentItemId: event.target.value,
                                              }
                                            : candidate,
                                      ),
                                    }))
                                  }}
                                  value={row.assessmentItemId}
                                >
                                  <option value="">Select item</option>
                                  {assessment.items.map((item) => (
                                    <option key={item.id} value={item.id}>
                                      #{item.displayOrder} - {item.snapshotStemPlainText}
                                    </option>
                                  ))}
                                </SelectField>
                              </div>
                            ))
                          )}
                        </div>

                        <TextareaField
                          label="Metadata policy JSON"
                          onChange={(event) =>
                            setBindingDraft((current) => ({
                              ...current,
                              metadataPolicyJson: event.target.value,
                            }))
                          }
                          rows={4}
                          value={bindingDraft.metadataPolicyJson}
                        />
                        <TextareaField
                          label="Submission policy JSON"
                          onChange={(event) =>
                            setBindingDraft((current) => ({
                              ...current,
                              submissionPolicyJson: event.target.value,
                            }))
                          }
                          rows={4}
                          value={bindingDraft.submissionPolicyJson}
                        />
                        <TextareaField
                          label="Review policy JSON"
                          onChange={(event) =>
                            setBindingDraft((current) => ({
                              ...current,
                              reviewPolicyJson: event.target.value,
                            }))
                          }
                          rows={4}
                          value={bindingDraft.reviewPolicyJson}
                        />

                        <div className="flex flex-wrap gap-3">
                          <Button
                            isLoading={busyKey === 'save-paper-binding'}
                            onClick={() => {
                              void handleSaveBinding(false)
                            }}
                            variant="secondary"
                          >
                            Save paper binding draft
                          </Button>
                          <Button
                            isLoading={busyKey === 'activate-paper-binding'}
                            onClick={() => {
                              void handleSaveBinding(true)
                            }}
                          >
                            Activate paper binding
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-4 rounded-3xl border border-line bg-surface p-4">
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-ink">2. Submission queue</p>
                          <p className="text-sm leading-6 text-muted">
                            Review recognized submissions and open one item for manual
                            override or finalize.
                          </p>
                        </div>

                        {paperSubmissions.length === 0 ? (
                          <p className="text-sm leading-6 text-muted">
                            No offline paper submissions have been uploaded for this
                            assessment yet.
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {paperSubmissions.map((submission) => (
                              <button
                                className={`w-full rounded-3xl border px-4 py-4 text-left transition ${
                                  selectedSubmissionId === submission.id
                                    ? 'border-brand bg-brand-soft/60'
                                    : 'border-line bg-panel hover:border-brand/25'
                                }`}
                                key={submission.id}
                                onClick={() => {
                                  setSelectedSubmissionId(submission.id)
                                }}
                                type="button"
                              >
                                <div className="space-y-2">
                                  <p className="text-base font-semibold text-ink">
                                    {submission.status}
                                  </p>
                                  <p className="text-sm leading-6 text-muted">
                                    Score {submission.result?.score ?? 'Pending'} - Student{' '}
                                    {submission.result?.detectedStudentId ?? submission.studentUserId}
                                    <br />
                                    Quiz {submission.result?.detectedQuizId ?? 'N/A'} - Updated{' '}
                                    {formatUtcDate(submission.updatedAtUtc)}
                                  </p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        <div className="space-y-2 rounded-3xl border border-line bg-panel p-4">
                          <p className="text-sm font-semibold text-ink">Queue snapshot</p>
                          <p className="text-sm leading-6 text-muted">
                            {paperSubmissions.length} submission(s) loaded for this
                            assessment.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 rounded-3xl border border-line bg-surface p-4">
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-ink">3. Submission review</p>
                        <p className="text-sm leading-6 text-muted">
                          Inspect answers, download artifacts, save teacher review, or
                          finalize the submission.
                        </p>
                      </div>

                      {!selectedSubmissionId ? (
                        <div className="flex items-center gap-3 rounded-3xl border border-line bg-panel px-4 py-4 text-sm text-muted">
                          <FileSearch className="size-4 text-brand-strong" />
                          Select a submission from the queue to load the review detail.
                        </div>
                      ) : isSubmissionLoading ? (
                        <div className="flex items-center gap-3 rounded-3xl border border-line bg-panel px-4 py-4 text-sm text-muted">
                          <Spinner />
                          Loading submission detail...
                        </div>
                      ) : selectedSubmission ? (
                        <div className="space-y-4">
                          <div className="rounded-3xl border border-line bg-panel p-4">
                            <p className="text-base font-semibold text-ink">
                              Submission {selectedSubmission.status}
                            </p>
                            <p className="mt-2 text-sm leading-6 text-muted">
                              Student {selectedSubmission.result?.detectedStudentId ?? selectedSubmission.studentUserId}
                              <br />
                              Score {selectedSubmission.result?.score ?? 'Pending'} - Finalized{' '}
                              {formatUtcDate(selectedSubmission.finalizedAtUtc)}
                              <br />
                              Reviewed {formatUtcDate(selectedSubmission.reviewedAtUtc)}
                            </p>
                          </div>

                          <TextareaField
                            label="Teacher note"
                            onChange={(event) =>
                              setReviewDraft((current) => ({
                                ...current,
                                teacherNote: event.target.value,
                              }))
                            }
                            rows={3}
                            value={reviewDraft.teacherNote}
                          />

                          <div className="space-y-3">
                            <p className="text-sm font-semibold text-ink">Override answers</p>
                            {reviewDraft.overrideAnswers.map((answer, answerIndex) => (
                              <div
                                className="rounded-3xl border border-line bg-panel p-4"
                                key={`${answer.questionNumber}-${answer.assessmentItemId}`}
                              >
                                <div className="grid gap-4 lg:grid-cols-3">
                                  <TextField
                                    disabled
                                    label="Question number"
                                    value={String(answer.questionNumber)}
                                  />
                                  <TextField
                                    disabled
                                    label="Assessment item"
                                    value={answer.assessmentItemId}
                                  />
                                  <TextField
                                    label="Detected option"
                                    onChange={(event) =>
                                      setReviewDraft((current) => ({
                                        ...current,
                                        overrideAnswers: current.overrideAnswers.map(
                                          (candidate, candidateIndex) =>
                                            candidateIndex === answerIndex
                                              ? {
                                                  ...candidate,
                                                  detectedOption: event.target.value,
                                                }
                                              : candidate,
                                        ),
                                      }))
                                    }
                                    value={answer.detectedOption}
                                  />
                                </div>
                                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                                  <TextareaField
                                    label="Detected answer JSON"
                                    onChange={(event) =>
                                      setReviewDraft((current) => ({
                                        ...current,
                                        overrideAnswers: current.overrideAnswers.map(
                                          (candidate, candidateIndex) =>
                                            candidateIndex === answerIndex
                                              ? {
                                                  ...candidate,
                                                  detectedAnswerJson: event.target.value,
                                                }
                                              : candidate,
                                        ),
                                      }))
                                    }
                                    rows={4}
                                    value={answer.detectedAnswerJson}
                                  />
                                  <TextareaField
                                    label="Confidence JSON"
                                    onChange={(event) =>
                                      setReviewDraft((current) => ({
                                        ...current,
                                        overrideAnswers: current.overrideAnswers.map(
                                          (candidate, candidateIndex) =>
                                            candidateIndex === answerIndex
                                              ? {
                                                  ...candidate,
                                                  confidenceJson: event.target.value,
                                                }
                                              : candidate,
                                        ),
                                      }))
                                    }
                                    rows={4}
                                    value={answer.confidenceJson}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="space-y-3 rounded-3xl border border-line bg-panel p-4">
                            <p className="text-sm font-semibold text-ink">Artifacts</p>
                            {selectedSubmission.artifacts.length === 0 ? (
                              <p className="text-sm leading-6 text-muted">
                                No review artifacts were generated for this submission.
                              </p>
                            ) : (
                              <div className="flex flex-wrap gap-3">
                                {selectedSubmission.artifacts.map((artifact) => (
                                  <Button
                                    isLoading={busyKey === `download-artifact-${artifact.id}`}
                                    key={artifact.id}
                                    leftIcon={<Download className="size-4" />}
                                    onClick={() => {
                                      void handleDownloadArtifact(artifact.id)
                                    }}
                                    variant="secondary"
                                  >
                                    Download {artifact.artifactType}
                                  </Button>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-3">
                            <Button
                              isLoading={busyKey === 'review-paper-submission'}
                              onClick={() => {
                                void handleReviewSubmission(false)
                              }}
                              variant="secondary"
                            >
                              Review submission
                            </Button>
                            <Button
                              isLoading={busyKey === 'finalize-paper-submission'}
                              onClick={() => {
                                void handleReviewSubmission(true)
                              }}
                            >
                              Finalize submission
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm leading-6 text-muted">
                          Submission detail is unavailable right now.
                        </p>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </CardShell>
          )
        })}
      </div>
    </div>
  )
}
