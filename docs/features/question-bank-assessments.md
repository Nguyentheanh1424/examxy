# Question Bank & Assessments

## Scope

This module consists of two domains:

1. teacher-global question bank
2. class-scoped assessments + student attempts

## Question Bank Design

### Ownership

- each question belongs to `OwnerTeacherUserId`
- teachers can only CRUD their own questions

### Versioning

- table `QuestionBankQuestions`
  - `CurrentVersionNumber`
  - `Status` (`Active | Archived`)
  - soft delete via `DeletedAtUtc`

- table `QuestionBankQuestionVersions`
  - stores snapshots of stem/content/answer key per version

- updating a question creates a new version (append-only history)

### Tags & Attachments

- `QuestionBankTags` are unique per `(OwnerTeacherUserId, NormalizedName)`
- join table: `QuestionBankQuestionTags`
- `QuestionBankAttachments` store version-level metadata + external URLs

## Assessment Design

### Lifecycle

- statuses:
  - `Draft`
  - `Published`
  - `Closed`

- flow:
  - create draft
  - update draft content
  - publish
  - after publish: content is locked (only schedule/visibility can be updated via publish endpoint)

### Data Snapshot Rule

- `ClassAssessmentItem` stores a snapshot of question data at the time it is added to the assessment

- supports 2 modes:
  - sourced from question bank (`SourceQuestionId`, `SourceQuestionVersionId`)
  - inline snapshot (no source question required)

### Attempts & Answers

- `StudentAssessmentAttempt`
  - one row per student attempt number
  - unique `(AssessmentId, StudentUserId, AttemptNumber)`

- `StudentAssessmentAnswer`
  - unique `(AttemptId, AssessmentItemId)`
  - stores `AnswerJson`, `IsCorrect`, `EarnedPoints`, `AutoGradedAtUtc`

## Auto-grade Rules (V2)

- objective types are auto-graded:
  - `SingleChoice`
  - `MultipleChoice`
  - `TrueFalse`
  - `Matching`
  - `Ordering`

- `MediaBased`, `MathFormula`:
  - set `IsCorrect = null`, score = 0 (manual grading backlog)

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

### Offline paper exam extension

- template workspace
  - `GET /api/paper-exam/templates`
  - `POST /api/paper-exam/templates`
  - `GET /api/paper-exam/templates/{templateId}`
  - `POST /api/paper-exam/templates/{templateId}/versions`
  - `GET /api/paper-exam/templates/{templateId}/versions/{versionId}`
  - `PUT /api/paper-exam/templates/{templateId}/versions/{versionId}`
  - `POST /api/paper-exam/templates/{templateId}/versions/{versionId}/assets`
  - `PUT /api/paper-exam/templates/{templateId}/versions/{versionId}/metadata-fields`
  - `POST /api/paper-exam/templates/{templateId}/versions/{versionId}/validate`
  - `POST /api/paper-exam/templates/{templateId}/versions/{versionId}/publish`
  - `POST /api/paper-exam/templates/{templateId}/versions/{versionId}/clone`
- assessment binding + review
  - `GET /api/classes/{classId}/assessments/{assessmentId}/paper-binding` (teacher owner, returns `Draft` or `Active`)
  - `POST /api/classes/{classId}/assessments/{assessmentId}/paper-binding` (teacher owner)
  - `POST /api/classes/{classId}/assessments/{assessmentId}/paper-binding/activate` (teacher owner)
  - `GET /api/classes/{classId}/assessments/{assessmentId}/offline-scan-config` (student)
  - `POST /api/classes/{classId}/assessments/{assessmentId}/offline-submissions` (student scanner client)
  - `GET /api/classes/{classId}/assessments/{assessmentId}/offline-submissions` (teacher owner)
  - `GET /api/classes/{classId}/assessments/{assessmentId}/offline-submissions/{submissionId}` (teacher owner)
  - `POST /api/classes/{classId}/assessments/{assessmentId}/offline-submissions/{submissionId}/review` (teacher owner)
  - `POST /api/classes/{classId}/assessments/{assessmentId}/offline-submissions/{submissionId}/finalize` (teacher owner)
  - `GET /api/classes/{classId}/assessments/{assessmentId}/offline-submissions/{submissionId}/artifacts/{artifactId}` (teacher owner)

## Enforcement Rules

- only the teacher owner can create/update/publish assessments
- students must be active members to attempt assessments
- attempt limits are enforced before creating a new attempt
- assessment availability is enforced based on status + publish/close window
- only the teacher owner can read or mutate assessment paper bindings, review submissions, or download paper-scan artifacts
