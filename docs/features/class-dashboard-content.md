# Class Dashboard & Content (Backend Design)

## Scope

Module nay handle:

- class dashboard summary
- feed posts/comments
- reactions
- mentions (`notifyAll`, `taggedUserIds`)
- in-app notifications
- class schedule items

## Authorization Rules

- Teacher owner:
  - full read/write cho content + schedule trong class do minh so huu.
- Student member (`ClassMembershipStatus.Active`):
  - read dashboard/feed/schedule
  - create/update own comments
  - react post/comment
- Non-member:
  - deny (`403`) hoac `404` tuy endpoint/visibility.

Backend check role + membership trong service, khong dua vao FE trust.

## API Contract

Base route: `/api/classes/{classId}`

- `GET /dashboard`
  - summary counters: students, feed items, schedule, unread notifications.
- `GET /feed`
  - list `ClassFeedItemDto` (post + comments + reaction summary + mention summary).
- `GET /mention-candidates`
  - list `ClassMentionCandidateDto` de FE render user picker cho `taggedUserIds`.
- `POST /posts` (teacher)
- `PUT /posts/{postId}` (teacher)
- `POST /posts/{postId}/comments`
- `PUT /comments/{commentId}`
- `DELETE /comments/{commentId}` (teacher hide)
- `PUT /posts/{postId}/reaction`
- `PUT /comments/{commentId}/reaction`
- `GET /schedule-items`
- `POST /schedule-items` (teacher)
- `PUT /schedule-items/{scheduleItemId}` (teacher)

## Reaction Rules

- one reaction/user/target:
  - unique index `(PostId, UserId)`
  - unique index `(CommentId, UserId)`
- set same target reaction:
  - create neu chua co
  - update neu da co
- remove reaction:
  - request `reactionType = null` hoac empty -> delete current row

## Tagging + Notify Rules

- DTO co 2 fields:
  - `notifyAll: bool`
  - `taggedUserIds: string[]`
- mention user rows duoc sync lai moi lan create/update.
- `notifyAll` tao row mention-all (post/comment).
- notifications luu vao `ClassNotifications` voi `NotificationKey` unique.
- key unique dam bao idempotent khi retry/update lai cung context.
- khi `notifyAll=true`, notification channel `all` duoc uu tien (khong duplicate spam tag mode).

## Database Schema (Key Tables)

- `ClassPosts`
  - content + status (`Draft|Published|Closed`) + publish/close windows.
- `ClassComments`
  - owner, hidden flags, soft delete.
- `ClassPostReactions`, `ClassCommentReactions`
  - reaction type enum + unique constraints per user/target.
- `ClassPostMentionUsers`, `ClassPostMentionAll`
- `ClassCommentMentionUsers`, `ClassCommentMentionAll`
- `ClassNotifications`
  - source/type/title/message/link/payload
  - `NotificationKey` unique index.
- `ClassScheduleItems`
  - event/deadline/assessment/reminder metadata.

## Soft Delete Policy

- soft delete fields dang co tren:
  - `ClassPost.DeletedAtUtc`
  - `ClassComment.DeletedAtUtc`
- hidden comment dung `IsHidden`, `HiddenByTeacherUserId`, `HiddenAtUtc`.

## Notes

- attachment hien tai dung metadata + external URL (khong binary store trong DB).
- reminder worker (`24h before`) chua implement o V1/V2.
