import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'

import { toast } from '@/components/ui/sonner'
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
import {
  createBindingDraftState,
  createReviewDraftState,
  emptyBindingDraft,
  emptyDraft,
  emptyReviewDraft,
  hasReviewDraftChanges,
  toCreateAssessmentRequest,
  type AssessmentStatusTab,
  type BindingDraftState,
  type DraftAssessmentFormState,
  type PublishedTemplateVersionOption,
  type ReviewDraftState,
} from '@/features/assessments/lib/assessment-page-mappers'
import { getErrorMessage } from '@/lib/http/api-error'
import type { Assessment, PublishAssessmentRequest, StudentAssessmentAttempt } from '@/types/assessment'
import type { AssessmentPaperBinding, AssessmentPaperBindingMapItem, AssessmentScanSubmission, OfflineRecognizedAnswer, PaperExamTemplate } from '@/types/paper-exam'

export function useClassAssessmentsPage() {
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
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false)
  const [statusTab, setStatusTab] = useState<AssessmentStatusTab>('All')
  const [publishTarget, setPublishTarget] = useState<Assessment | null>(null)
  const [submitTargetId, setSubmitTargetId] = useState<string | null>(null)
  const [activateBindingDialogOpen, setActivateBindingDialogOpen] = useState(false)
  const [finalizeDialogOpen, setFinalizeDialogOpen] = useState(false)

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

  const filteredAssessments = useMemo(
    () =>
      assessments.filter((assessment) =>
        statusTab === 'All' ? true : assessment.status === statusTab,
      ),
    [assessments, statusTab],
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
        title: 'Lỗi làm mới',
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
      setCreateDrawerOpen(false)
      setNotice({
        tone: 'success',
        title: 'Assessment created',
        message: 'The new draft assessment is now available in this class.',
      })
      toast({
        description: 'The new draft assessment is now available in this class.',
        title: 'Assessment created',
        tone: 'success',
      })
    } catch (nextError) {
      setNotice({
        tone: 'error',
        title: 'Unable to create assessment',
        message: getErrorMessage(nextError, 'Check the assessment payload and try again.'),
      })
      toast({
        description: getErrorMessage(nextError, 'Check the assessment payload and try again.'),
        title: 'Unable to create assessment',
        tone: 'error',
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
      setPublishTarget(null)
      toast({
        description: 'Students can now see the assessment according to its schedule.',
        title: 'Assessment published',
        tone: 'success',
      })
    } catch (nextError) {
      setNotice({
        tone: 'error',
        title: 'Unable to publish assessment',
        message: getErrorMessage(nextError, 'The assessment could not be published.'),
      })
      toast({
        description: getErrorMessage(nextError, 'The assessment could not be published.'),
        title: 'Unable to publish assessment',
        tone: 'error',
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
      setSubmitTargetId(null)
      toast({
        description: 'The attempt has been submitted and graded according to the current policy.',
        title: 'Attempt submitted',
        tone: 'success',
      })
    } catch (nextError) {
      setNotice({
        tone: 'error',
        title: 'Unable to submit attempt',
        message: getErrorMessage(nextError, 'The attempt could not be submitted.'),
      })
      toast({
        description: getErrorMessage(nextError, 'The attempt could not be submitted.'),
        title: 'Unable to submit attempt',
        tone: 'error',
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
      setActivateBindingDialogOpen(false)
      toast({
        description: activate
          ? 'The assessment now uses the selected paper template version.'
          : 'The binding draft was saved without activating it yet.',
        title: activate ? 'Paper binding activated' : 'Paper binding saved',
        tone: 'success',
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
      toast({
        description: getErrorMessage(nextError, 'The paper binding could not be updated.'),
        title: 'Unable to save paper binding',
        tone: 'error',
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
      setFinalizeDialogOpen(false)
      toast({
        description: forceFinalize
          ? 'The paper-exam submission is now finalized.'
          : 'Teacher review changes were saved.',
        title: forceFinalize ? 'Submission finalized' : 'Submission reviewed',
        tone: 'success',
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
      toast({
        description: getErrorMessage(nextError, 'The paper-exam review could not be completed.'),
        title: forceFinalize ? 'Unable to finalize submission' : 'Unable to review submission',
        tone: 'error',
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


  return {
    classId, session, searchParams, setSearchParams, assessments, setAssessments, resultsByAssessmentId, setResultsByAssessmentId, attemptByAssessmentId, setAttemptByAssessmentId, answerDraftByItemId, setAnswerDraftByItemId, className, setClassName, isTeacherOwner, setIsTeacherOwner, paperTemplates, setPaperTemplates, paperBinding, setPaperBinding, bindingDraft, setBindingDraft, paperSubmissions, setPaperSubmissions, selectedSubmissionId, setSelectedSubmissionId, selectedSubmission, setSelectedSubmission, reviewDraft, setReviewDraft, isLoading, isPaperLoading, isSubmissionLoading, busyKey, error, notice, draft, setDraft, createDrawerOpen, setCreateDrawerOpen, statusTab, setStatusTab, publishTarget, setPublishTarget, submitTargetId, setSubmitTargetId, activateBindingDialogOpen, setActivateBindingDialogOpen, finalizeDialogOpen, setFinalizeDialogOpen, selectedAssessmentId, selectedAssessment, publishedTemplateVersions, selectedPaperTemplateVersion, filteredAssessments, loadData, refreshAssessments, refreshPaperTemplates, refreshPaperExamState, handleCreateAssessment, handlePublish, handleLoadResults, handleStartAttempt, handleSaveAnswers, handleSubmitAttempt, handleSaveBinding, handleReviewSubmission, handleDownloadArtifact,
  }
}

export type ClassAssessmentsPageController = ReturnType<typeof useClassAssessmentsPage>
