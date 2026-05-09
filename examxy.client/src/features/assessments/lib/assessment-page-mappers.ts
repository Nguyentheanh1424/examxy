import type { Assessment, CreateAssessmentRequest } from '@/types/assessment'
import type {
  AssessmentPaperBinding,
  AssessmentPaperBindingMapItem,
  AssessmentScanSubmission,
  PaperExamTemplateVersion,
} from '@/types/paper-exam'

export interface DraftAssessmentFormState {
  title: string
  description: string
  assessmentKind: string
  attemptLimit: string
  timeLimitMinutes: string
  showAnswersMode: string
  scoreReleaseMode: string
  itemsJson: string
}

export interface BindingAnswerMapDraftState {
  questionNumber: string
  assessmentItemId: string
}

export interface BindingDraftState {
  templateVersionId: string
  metadataPolicyJson: string
  submissionPolicyJson: string
  reviewPolicyJson: string
  answerMap: BindingAnswerMapDraftState[]
}

export interface ReviewAnswerDraftState {
  questionNumber: number
  assessmentItemId: string
  detectedOption: string
  detectedAnswerJson: string
  confidenceJson: string
}

export interface ReviewDraftState {
  teacherNote: string
  overrideAnswers: ReviewAnswerDraftState[]
}

export type AssessmentStatusTab = 'All' | 'Draft' | 'Published' | 'Closed'

export interface PublishedTemplateVersionOption {
  templateCode: string
  templateName: string
  version: PaperExamTemplateVersion
}

export const emptyDraft: DraftAssessmentFormState = {
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

export const emptyBindingDraft: BindingDraftState = {
  templateVersionId: '',
  metadataPolicyJson: '{}',
  submissionPolicyJson: '{}',
  reviewPolicyJson: '{}',
  answerMap: [],
}

export const emptyReviewDraft: ReviewDraftState = {
  teacherNote: '',
  overrideAnswers: [],
}

export function formatUtcDate(value: string | null) {
  if (!value) return 'Not scheduled'
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function toCreateAssessmentRequest(
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

export function createDefaultAnswerMap(
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

export function parseBindingAnswerMap(
  answerMapJson: string,
): AssessmentPaperBindingMapItem[] {
  try {
    const parsed = JSON.parse(answerMapJson) as AssessmentPaperBindingMapItem[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function createBindingDraftState(
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

export function createReviewDraftState(submission: AssessmentScanSubmission): ReviewDraftState {
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

export function hasReviewDraftChanges(
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
