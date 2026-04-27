# Class Dashboard & Content (Backend Design)

## Scope

This module handles:

- class dashboard summary
- feed posts/comments
- reactions
- mentions (`notifyAll`, `taggedUserIds`)
- class-scoped unread notification count
- class schedule items

## Authorization Rules

- Teacher (owner):
  - full read/write access to content + schedule in classes they own
- Student member (`ClassMembershipStatus.Active`):
  - read dashboard/feed/schedule
  - create/update own comments
  - react to posts/comments
- Non-member:
  - denied (`403`) or `404` depending on endpoint/visibility

Backend enforces role + membership checks in the service layer, not relying on frontend trust.

## API Contract

Base route: `/api/classes/{classId}`

- `GET /dashboard`
  - summary counters: students, feed items, schedule, unread notifications
- `GET /feed`
  - returns list of `ClassFeedItemDto` (post + comments + reaction summary + mention summary)
- `GET /mention-candidates`
  - returns list of `ClassMentionCandidateDto` for FE user picker (`taggedUserIds`)
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

- one reaction per user per target:
  - unique index `(PostId, UserId)`
  - unique index `(CommentId, UserId)`
- setting a reaction:
  - create if not exists
  - update if exists
- removing a reaction:
  - request `reactionType = null` or empty → delete current row

## Tagging + Notification Rules

- DTO includes 2 fields:
  - `notifyAll: bool`
  - `taggedUserIds: string[]`
- mention rows are re-synced on every create/update
- `notifyAll` creates a mention-all row (post/comment)
- notifications are written to account-level inbox with unique `NotificationKey`
- unique key ensures idempotency for retries/updates in the same context
- when `notifyAll = true`, the `all` channel is prioritized (avoid duplicate spam from tag mode)
- `LinkPath` must point to the currently shipped FE route
- canonical notification API is defined in `docs/features/notifications.md`
- current canonical FE route for class-origin notifications is `/classes/{classId}`
  - specific targets (`feed`, `assessment`, `schedule`, `postId`, `commentId`, `assessmentId`, `scheduleItemId`) are included in payload/DTO for FE to open the correct feature in the dashboard
- schedule reminder notifications reuse the same inbox pipeline with `SourceType = ScheduleItem`
  - current reminder scope is `Assessment` and `Deadline` schedule items only
  - reminder lead times are configurable with `NotificationReminders:LeadTimesHours`, with legacy `LeadTimeHours` as fallback
  - recipients are active student memberships only
  - deep link is `/classes/{classId}?scheduleItemId={scheduleItemId}`

## Database Schema (Key Tables)

- `ClassPosts`
  - content + status (`Draft | Published | Closed`) + publish/close windows
- `ClassComments`
  - owner, hidden flags, soft delete
- `ClassPostReactions`, `ClassCommentReactions`
  - reaction type enum + unique constraints per user/target
- `ClassPostMentionUsers`, `ClassPostMentionAll`
- `ClassCommentMentionUsers`, `ClassCommentMentionAll`
- `UserNotifications`
  - recipient/source/type/title/message/link/payload
  - optional `ClassId` for class context
  - unique index on `NotificationKey`
- `ClassScheduleItems`
  - event/deadline/assessment/reminder metadata

## Soft Delete Policy

- soft delete fields exist on:
  - `ClassPost.DeletedAtUtc`
  - `ClassComment.DeletedAtUtc`
- hidden comments use:
  - `IsHidden`
  - `HiddenByTeacherUserId`
  - `HiddenAtUtc`

## Notes

- attachments currently use metadata + external URLs (no binary storage in DB)
- reminder worker is implemented for `24h before` on `Assessment` and `Deadline` schedule items only
- V1 reminder delivery remains inbox + SignalR only; no email/push delivery and no revoke/update after dispatch
- real-time class feed sync uses SignalR room `class:{classId}`; canonical contract is defined in `docs/features/realtime.md`
