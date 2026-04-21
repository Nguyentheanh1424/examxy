# Notifications (Backend Design)

## Scope

Module nay handle:

- account-level inbox cho tung user
- list/filter unread notifications
- mark read 1 notification
- mark read hang loat theo inbox hoac theo filter
- deep-link metadata toi class feed/assessment va cac feature khac trong tuong lai

## API Contract

Base route: `/api/notifications`

- `GET /`
  - list `NotificationInboxListDto` cho current user
  - support `onlyUnread`, `limit`, `classId`, `scope`, `sourceType`, `notificationType`
- `POST /{notificationId}/read`
  - mark 1 notification la da doc
- `POST /read-all`
  - mark nhieu notification la da doc
  - support cung filter `classId`, `scope`, `sourceType`, `notificationType`

## Data / Ownership Rules

- notification thuoc `RecipientUserId`, khong thuoc rieng 1 classroom.
- `ClassId` la context optional de support class filter va class dashboard badge.
- `NotificationKey` unique de giu idempotency khi retry.
- `LinkPath` phai tro toi route FE dang ship.
- metadata target nam trong payload/DTO:
  - `featureArea`
  - `classId?`
  - `postId?`
  - `commentId?`
  - `assessmentId?`

## Current Sources

- class post mention
- class comment mention
- notify-all trong class content
- assessment published

## Notes

- `GET /api/classes/{classId}/dashboard` van giu `UnreadNotificationCount` theo class, khong doi thanh global unread.
- V1 chua co worker/reminder out-of-band; notifications van la in-app persistence only.
