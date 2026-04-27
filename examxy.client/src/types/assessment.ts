export interface AssessmentItem {
  id: string
  displayOrder: number
  sourceQuestionId: string | null
  sourceQuestionVersionId: string | null
  points: number
  snapshotQuestionType: string
  snapshotStemRichText: string
  snapshotStemPlainText: string
  snapshotContentJson: string
  snapshotAnswerKeyJson: string
}

export interface Assessment {
  id: string
  classId: string
  title: string
  descriptionRichText: string
  descriptionPlainText: string
  assessmentKind: string
  status: string
  attemptLimit: number
  timeLimitMinutes: number | null
  questionOrderMode: string
  showAnswersMode: string
  scoreReleaseMode: string
  publishAtUtc: string | null
  closeAtUtc: string | null
  publishedAtUtc: string | null
  createdAtUtc: string
  updatedAtUtc: string
  items: AssessmentItem[]
}

export interface CreateAssessmentItemRequest {
  displayOrder: number
  sourceQuestionId: string | null
  sourceQuestionVersionId: string | null
  points: number
  snapshotQuestionType: string
  snapshotStemRichText: string
  snapshotStemPlainText: string
  snapshotContentJson: string
  snapshotAnswerKeyJson: string
}

export interface CreateAssessmentRequest {
  title: string
  descriptionRichText: string
  descriptionPlainText: string
  assessmentKind: string
  attemptLimit: number
  timeLimitMinutes: number | null
  questionOrderMode: string
  showAnswersMode: string
  scoreReleaseMode: string
  publishAtUtc: string | null
  closeAtUtc: string | null
  items: CreateAssessmentItemRequest[]
}

export type UpdateAssessmentRequest = CreateAssessmentRequest

export interface PublishAssessmentRequest {
  publishAtUtc: string | null
  closeAtUtc: string | null
  showAnswersMode: string
  scoreReleaseMode: string
}

export interface StudentAssessmentAnswer {
  id: string
  assessmentItemId: string
  questionType: string
  answerJson: string
  isCorrect: boolean | null
  earnedPoints: number
}

export interface StudentAssessmentAttempt {
  id: string
  assessmentId: string
  classId: string
  attemptNumber: number
  status: string
  startedAtUtc: string
  submittedAtUtc: string | null
  autoGradedAtUtc: string | null
  timeLimitMinutesSnapshot: number | null
  maxScore: number
  earnedScore: number
  answers: StudentAssessmentAnswer[]
}

export interface SaveAnswerItemRequest {
  assessmentItemId: string
  questionType: string
  answerJson: string
}

export interface SaveAttemptAnswersRequest {
  items: SaveAnswerItemRequest[]
}
