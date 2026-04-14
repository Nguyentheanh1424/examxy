# Identity + Class Foundation

## Summary

Nen tang role-based hien tai:

- `Teacher`
- `Student`
- `Admin`

Class module da mo rong tu foundation sang content + assessments, nhung authorization van theo nguyen tac:

1. role policy guard o API layer
2. class ownership/membership guard o service layer

## Role Provision Rules

- `Teacher`
  - public register flow `POST /api/auth/register`
  - owner class + class content + question bank + class assessments
- `Student`
  - `POST /api/auth/register/student` hoac duoc teacher invite/import
  - join class qua invite claim
  - consume class feed + attempt assessment
- `Admin`
  - internal provisioning only
  - khong di qua public signup

`primaryRole` duoc tra trong auth responses de FE route nhanh.

## Core Data Model

### Identity

- `ApplicationUser`
- `TeacherProfile` (1-1)
- `StudentProfile` (1-1, onboarding state)

### Class Foundation

- `Classroom` (`Name`, `Code`, `OwnerTeacherUserId`, `TimezoneId`, `Status`)
- `ClassMembership`
- `ClassInvite`
- `StudentImportBatch` + `StudentImportItem`

### Class Content

- `ClassPost`, `ClassComment`
- `ClassPostReaction`, `ClassCommentReaction`
- `ClassPostMentionUser`, `ClassPostMentionAll`
- `ClassCommentMentionUser`, `ClassCommentMentionAll`
- `ClassNotification`
- `ClassScheduleItem`

### Question & Assessment

- Question bank:
  - `QuestionBankQuestion`, `QuestionBankQuestionVersion`
  - `QuestionBankTag`, `QuestionBankQuestionTag`
  - `QuestionBankAttachment`
- Assessment:
  - `ClassAssessment`, `ClassAssessmentItem`
  - `StudentAssessmentAttempt`, `StudentAssessmentAnswer`

## API Surface (Current)

### Auth & identity

- `POST /api/auth/register`
- `POST /api/auth/register/student`
- `POST /api/auth/login`
- `POST /api/auth/refresh-token`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Class foundation (teacher)

- `GET /api/classes`
- `POST /api/classes`
- `GET /api/classes/{classId}`
- `PUT /api/classes/{classId}`
- `DELETE /api/classes/{classId}`
- `POST /api/classes/{classId}/roster-imports` (multipart file)
- `POST /api/classes/{classId}/students`
- `DELETE /api/classes/{classId}/memberships/{membershipId}`
- `POST /api/classes/{classId}/invites/{inviteId}/resend`
- `POST /api/classes/{classId}/invites/{inviteId}/cancel`

### Class content (class-scoped)

- `GET /api/classes/{classId}/dashboard`
- `GET /api/classes/{classId}/feed`
- `POST /api/classes/{classId}/posts` (teacher)
- `PUT /api/classes/{classId}/posts/{postId}` (teacher)
- `POST /api/classes/{classId}/posts/{postId}/comments`
- `PUT /api/classes/{classId}/comments/{commentId}`
- `DELETE /api/classes/{classId}/comments/{commentId}` (teacher hide)
- `PUT /api/classes/{classId}/posts/{postId}/reaction`
- `PUT /api/classes/{classId}/comments/{commentId}/reaction`
- `GET /api/classes/{classId}/schedule-items`
- `POST /api/classes/{classId}/schedule-items` (teacher)
- `PUT /api/classes/{classId}/schedule-items/{scheduleItemId}` (teacher)

### Question bank (teacher-global)

- `GET /api/question-bank/questions`
- `POST /api/question-bank/questions`
- `GET /api/question-bank/questions/{questionId}`
- `PUT /api/question-bank/questions/{questionId}`
- `DELETE /api/question-bank/questions/{questionId}`

### Assessments (class-scoped)

- `GET /api/classes/{classId}/assessments`
- `POST /api/classes/{classId}/assessments` (teacher)
- `PUT /api/classes/{classId}/assessments/{assessmentId}` (teacher draft only)
- `POST /api/classes/{classId}/assessments/{assessmentId}/publish` (teacher)
- `POST /api/classes/{classId}/assessments/{assessmentId}/attempts` (student)
- `PUT /api/classes/{classId}/assessments/attempts/{attemptId}/answers` (student)
- `POST /api/classes/{classId}/assessments/attempts/{attemptId}/submit` (student)
- `GET /api/classes/{classId}/assessments/{assessmentId}/results` (teacher)

### Student foundation

- `GET /api/student/dashboard`
- `POST /api/student/invites/claim`

## Behavioral Contracts

- owner teacher only duoc mutate class metadata/content/assessment publish.
- student phai la active member moi duoc feed/comment/react/attempt.
- backend enforce role + membership, FE chi show/hide UI.
- post/comment mention notifications dung notification key unique de idempotent.
- assessment sau publish khoa content; chi schedule/visibility duoc doi qua publish endpoint.

## Backlog Notes

- reminder worker `24h` chua implement (doc backlog).
- admin UI van placeholder.
