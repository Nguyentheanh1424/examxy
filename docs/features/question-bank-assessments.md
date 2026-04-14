# Question Bank & Assessments

## Scope

Module gom 2 domain:

1. teacher-global question bank
2. class-scoped assessments + student attempts

## Question Bank Design

### Ownership

- moi question thuoc `OwnerTeacherUserId`.
- teacher chi CRUD question cua chinh minh.

### Versioning

- table `QuestionBankQuestions`
  - `CurrentVersionNumber`
  - `Status` (`Active|Archived`)
  - soft delete `DeletedAtUtc`
- table `QuestionBankQuestionVersions`
  - snapshot stem/content/answer key theo tung version.
- update question tao version moi (append-only history).

### Tags & Attachments

- `QuestionBankTags` unique theo `(OwnerTeacherUserId, NormalizedName)`.
- join table `QuestionBankQuestionTags`.
- `QuestionBankAttachments` cho version-level metadata + external URL.

## Assessment Design

### Lifecycle

- status:
  - `Draft`
  - `Published`
  - `Closed`
- flow:
  - create draft
  - update draft content
  - publish
  - sau publish: lock content (chi schedule/visibility co the thay doi qua publish endpoint)

### Data Snapshot Rule

- `ClassAssessmentItem` luu snapshot question data tai thoi diem add vao assessment.
- support 2 mode:
  - source tu question bank (`SourceQuestionId`, `SourceQuestionVersionId`)
  - inline snapshot (khong can source question)

### Attempts & Answers

- `StudentAssessmentAttempt`
  - one row per student attempt number
  - unique `(AssessmentId, StudentUserId, AttemptNumber)`
- `StudentAssessmentAnswer`
  - unique `(AttemptId, AssessmentItemId)`
  - luu `AnswerJson`, `IsCorrect`, `EarnedPoints`, `AutoGradedAtUtc`

## Auto-grade Rules (V2)

- objective types duoc auto-grade:
  - `SingleChoice`
  - `MultipleChoice`
  - `TrueFalse`
  - `Matching`
  - `Ordering`
- `MediaBased`, `MathFormula`:
  - set `IsCorrect = null`, score = 0 (manual grading backlog).

## API Contract

### Question bank

- `GET /api/question-bank/questions`
- `POST /api/question-bank/questions`
- `GET /api/question-bank/questions/{questionId}`
- `PUT /api/question-bank/questions/{questionId}`
- `DELETE /api/question-bank/questions/{questionId}`

### Assessments

- `GET /api/classes/{classId}/assessments`
- `POST /api/classes/{classId}/assessments` (teacher)
- `PUT /api/classes/{classId}/assessments/{assessmentId}` (teacher, draft only)
- `POST /api/classes/{classId}/assessments/{assessmentId}/publish` (teacher)
- `POST /api/classes/{classId}/assessments/{assessmentId}/attempts` (student)
- `PUT /api/classes/{classId}/assessments/attempts/{attemptId}/answers` (student)
- `POST /api/classes/{classId}/assessments/attempts/{attemptId}/submit` (student)
- `GET /api/classes/{classId}/assessments/{assessmentId}/results` (teacher)

## Enforcement Rules

- teacher owner moi duoc create/update/publish assessment.
- student phai la active member moi duoc attempt.
- attempt limit enforce truoc khi tao attempt moi.
- assessment availability enforce theo status + publish/close window.
