# Frontend Flow - Class Dashboard (V1)

## Goal

Teacher va Student dung chung class dashboard theo route canonical.
Khac biet chi nam o action availability (UI show/hide theo role), backend van la gate cuoi cho permission.

## Canonical Route

- route chinh: `/classes/{classId}`
- role duoc vao: `Teacher`, `Student`
- legacy teacher route `/teacher/classes/{classId}` redirect ve canonical route de giu deep-link cu.

## Shared Layout Blocks (V1 Scope)

1. Header: class name/code/status + quick stats.
2. Sections:
   - Feed
   - Schedule
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

## Screen State Flow

### Class dashboard load

- `loading`: skeleton cards + feed placeholders
- `empty`: no post/no schedule message
- `error`: retry CTA + error message
- `success`: render full sections

### Feed

- `loading`: list skeleton
- `empty`: "chua co bai dang"
- `error`: inline error block
- `success`: posts + comments + reactions + mention summary

### Schedule

- `loading`: list skeleton
- `empty`: no schedule item
- `error`: inline error block
- `success`: list schedule items

## Action -> API Mapping (V1)

- load dashboard summary: `GET /api/classes/{classId}/dashboard`
- load feed: `GET /api/classes/{classId}/feed`
- load mention candidates: `GET /api/classes/{classId}/mention-candidates`
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

## FE Flow for Tag/Notify/React

### Post/comment compose

- FE form payload:
  - `notifyAll: boolean`
  - `taggedUserIds: string[]`
- submit success:
  - update/refetch section de dong bo state

### Mention summary render (read-only)

- render ngay duoi noi dung post/comment
- `notifyAll=true`: show badge/text `Notify all`
- `taggedUserIds`: map qua `mentionCandidates`
- fallback khi thieu candidate: hien thi `@{userId}`

### Reaction

- click same reaction twice:
  - send `reactionType = null` de remove
- click different reaction:
  - send new `reactionType`
- chi update local summary khi API response thanh cong
- neu API fail:
  - show `Notice` tone error
  - khong mutate local summary

## DTO Contracts FE Can Rely On (V1)

- `ClassDashboardDto`
- `ClassFeedItemDto` / `ClassPostDto` / `ClassCommentDto`
- `ClassReactionSummaryDto`
- `ClassMentionSummaryDto`
- `ClassScheduleItemDto`

## Assessment Capability Reference

Class dashboard V1 chua bao gom assessment UI flow.
Kha nang assessment backend va tai lieu lien quan nam o:

- `docs/features/question-bank-assessments.md`
- `docs/features/api-flow-assessment.md`
