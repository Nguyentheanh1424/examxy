# Notifications (Backend Design)

## Scope

This module handles:

- account-level inbox for each user
- listing/filtering unread notifications
- marking a single notification as read
- bulk marking notifications as read (by inbox or filter)
- deep-link metadata to class feed, assessment, and schedule targets
- background `24h` reminders for assessment/deadline schedule items

## API Contract

Base route: `/api/notifications`

- `GET /`
  - returns `NotificationInboxListDto` for the current user
  - supports filters: `onlyUnread`, `limit`, `classId`, `scope`, `sourceType`, `notificationType`
  - `sourceType` currently accepts `Post`, `Comment`, `Assessment`, `ScheduleItem`

- `POST /{notificationId}/read`
  - mark a single notification as read

- `POST /read-all`
  - mark multiple notifications as read
  - supports filters: `classId`, `scope`, `sourceType`, `notificationType`

## Data / Ownership Rules

- notifications belong to `RecipientUserId`, not to a specific classroom
- `ClassId` is an optional context to support class filtering and dashboard badges
- `NotificationKey` is unique to ensure idempotency on retries
- `LinkPath` must point to the currently shipped frontend route
- target metadata is included in payload/DTO:
  - `featureArea`
  - `classId?`
  - `postId?`
  - `commentId?`
  - `assessmentId?`
  - `scheduleItemId?`
- schedule reminders use:
  - `NotificationType = ScheduleItemReminder24Hours` for the current inbox type name
  - `NotificationSourceType = ScheduleItem`
  - `SourceId = scheduleItemId`
- reminder deep-link payload uses:
  - `featureArea = "schedule"`
  - `classId`
  - `scheduleItemId`
  - `assessmentId?`
  - `linkPath = /classes/{classId}`

## Current Sources

- class post mentions
- class comment mentions
- notify-all in class content
- assessment published
- schedule item reminders for `Assessment` and `Deadline`

## Reminder Worker Rules

- reminder lead times come from `NotificationReminders:LeadTimesHours`; `LeadTimeHours` remains a backward-compatible fallback
- only non-deleted future schedule items are eligible
- only schedule item types `Assessment` and `Deadline` are eligible
- recipients are active student memberships only; teacher owner does not receive these reminders
- worker scans reminders due within the configured lookback window for each lead time and writes idempotent inbox rows using a `NotificationKey` that includes the lead-time window
- V1 uses the existing inbox + SignalR `notification.created` path only; no email/push delivery
- if a schedule item is rescheduled before dispatch, the worker uses the latest `StartAtUtc`
- if a reminder has already been dispatched and the schedule item changes later, V1 does not revoke or rewrite the existing notification

## Notes

- `GET /api/classes/{classId}/dashboard` still returns `UnreadNotificationCount` per class (not global unread)
- notification inbox supports real-time push via SignalR user room `user:{userId}`; canonical contract is defined in `docs/features/realtime.md`
