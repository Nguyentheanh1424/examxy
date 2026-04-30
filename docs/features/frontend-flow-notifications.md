# Frontend Flow - Notifications

## Purpose

Define planned UI pattern migration for the account notification inbox.

This document is planning guidance. Runtime UI migration has not shipped yet.

## Source files

| Type | Path |
|---|---|
| Real route | `/notifications` |
| Real page | `examxy.client/src/features/notifications/pages/notifications-page.tsx` |
| Real API | `examxy.client/src/features/notifications/lib/notification-api.ts` |
| Real types | `examxy.client/src/types/notification.ts` |
| Real tests | `examxy.client/src/features/notifications/pages/notifications-page.test.tsx` |
| tmp reference | `examxy.client/src/tmp/NotificationsPage.tsx` |

## Current behavior to preserve

- Realtime listener through `useRealtime`.
- Refresh on notification created/read events.
- Read/unread state.
- Mark-one read.
- Mark-all read.
- `onlyUnread` filtering.
- `classId` filtering.
- Deep-link building for schedule, assessments, class feed posts, and comments.
- Route `/notifications` protected for authenticated users.

## Candidate tmp patterns

| Pattern | Decision | Data support | Notes |
|---|---|---|---|
| Inbox layout polish | Candidate | Existing notification list | Low risk if actions stay the same. |
| Type/status filters | Conditional | Existing API filters and fields only | Avoid fake type groups. |
| Read/unread affordances | Candidate | Existing `isRead` and `readAtUtc` | Preserve semantics. |
| Class-aware context display | Candidate | Existing class metadata fields where present | Do not require missing class names. |
| Empty state | Candidate | Supported | No API change. |
| Notification preferences/settings | Backlog | No current preference API in notification page | Do not implement in phase 1. |

## Acceptance criteria

- Mark-one, mark-all, class/unread filters, realtime refresh, and deep-link behavior remain valid.
- No notification type/filter is shown unless backed by API fields or query support.
- Empty/loading/error states remain distinct.
- GitNexus impact is rerun before editing `NotificationsPage`.

## Related

- `docs/features/notifications.md`
- `docs/features/realtime.md`
- `docs/features/figma-ui-migration-phase-1.md`
