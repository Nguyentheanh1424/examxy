# Frontend Flow - Class Dashboard

## Goal

Teacher va Student dung chung dashboard layout theo class.
Khac biet chi nam o action availability (UI show/hide theo role).
Backend van la gate cuoi cho permission.

## Shared Layout Blocks

1. Header: class name/code/status + quick stats.
2. Tabs/sections:
   - Feed
   - Schedule
   - Assessments
3. Side panel (optional):
   - upcoming schedule
   - unread notifications

## UI Matrix (Teacher vs Student)

| Feature | Teacher | Student |
|---|---|---|
| View dashboard/feed/schedule | Yes | Yes (member only) |
| Create/update post | Yes | No |
| Create/update comment | Yes | Yes (own comment) |
| Hide comment | Yes | No |
| React post/comment | Yes | Yes |
| Tag user / notify all | Yes | Yes (when allowed by UI policy) |
| Create/update schedule item | Yes | No |
| Create/update/publish assessment | Yes | No |
| Start/save/submit attempt | No | Yes |
| View assessment results | Yes | No |

## Screen State Flow

### Class dashboard load

- `loading`: skeleton cards + feed placeholders
- `empty`: no post/no schedule/no assessment message
- `error`: retry CTA + error message
- `success`: render full sections

### Feed

- `loading`: list skeleton
- `empty`: "chua co bai dang"
- `error`: inline error block
- `success`: posts + comments + reactions

### Assessments (student)

- `loading`: assessment list skeleton
- `empty`: no active assessment
- `error`: fetch/submit errors
- `success`: list + attempt status + score states

## Action -> API Mapping

### Class foundation/content

- load class detail: `GET /api/classes/{classId}`
- load dashboard summary: `GET /api/classes/{classId}/dashboard`
- load feed: `GET /api/classes/{classId}/feed`
- create post (teacher): `POST /api/classes/{classId}/posts`
- update post (teacher): `PUT /api/classes/{classId}/posts/{postId}`
- create comment: `POST /api/classes/{classId}/posts/{postId}/comments`
- update comment: `PUT /api/classes/{classId}/comments/{commentId}`
- hide comment (teacher): `DELETE /api/classes/{classId}/comments/{commentId}`
- react post: `PUT /api/classes/{classId}/posts/{postId}/reaction`
- react comment: `PUT /api/classes/{classId}/comments/{commentId}/reaction`
- load schedule: `GET /api/classes/{classId}/schedule-items`
- create schedule (teacher): `POST /api/classes/{classId}/schedule-items`
- update schedule (teacher): `PUT /api/classes/{classId}/schedule-items/{scheduleItemId}`

### Question bank/assessment

- list question bank (teacher): `GET /api/question-bank/questions`
- create/update question (teacher): `POST|PUT /api/question-bank/questions*`
- list assessments: `GET /api/classes/{classId}/assessments`
- create/update assessment (teacher): `POST|PUT /api/classes/{classId}/assessments*`
- publish assessment (teacher): `POST /api/classes/{classId}/assessments/{assessmentId}/publish`
- start attempt (student): `POST /api/classes/{classId}/assessments/{assessmentId}/attempts`
- save answers (student): `PUT /api/classes/{classId}/assessments/attempts/{attemptId}/answers`
- submit attempt (student): `POST /api/classes/{classId}/assessments/attempts/{attemptId}/submit`

## FE Flow for Tag/Notify/React

### Post/comment compose

- FE form payload:
  - `notifyAll: boolean`
  - `taggedUserIds: string[]`
- when submit success:
  - update local feed item
  - optimistic fallback: refetch feed block

### Reaction

- click same reaction twice:
  - send `reactionType = null` de remove
- click different reaction:
  - send new `reactionType`
- UI use returned `ClassReactionSummaryDto` de update count + viewer reaction.

### Notification behavior note

- backend idempotent theo `NotificationKey`.
- FE co the retry safely khi network timeout.

## Role-based Visibility Rules (FE)

- FE check role de render action buttons.
- khong gate du lieu nhay cam chi bang FE; always handle `403/404` gracefully.
- teacher/student dashboard co layout chung, chi differ action modules.

## DTO Contracts FE Can Rely On

### Feed/content

- `ClassDashboardDto`
- `ClassFeedItemDto` / `ClassPostDto` / `ClassCommentDto`
- `ClassReactionSummaryDto`
- `ClassMentionSummaryDto`
- `ClassScheduleItemDto`

### Assessment

- `AssessmentDto` / `AssessmentItemDto`
- `StudentAssessmentAttemptDto`
- `StudentAssessmentAnswerDto`

## Error Handling Guidance

- `401`: force session refresh/login
- `403`: show "ban khong co quyen"
- `404`: show "tai nguyen khong ton tai hoac khong thuoc pham vi"
- `409`: show business conflict (attempt limit, publish lock, invite state)
