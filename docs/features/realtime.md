# Realtime (SignalR)

## Scope

Canonical contract for real-time server push using SignalR to synchronize:

- account-level notification inbox
- class feed activity (posts, comments, reactions)
- web and mobile app subscription contract

## Transport / Route

- hub route: `/hubs/realtime`
- auth: uses the same JWT scheme as REST API
- client sends token via `access_token` query param when establishing SignalR connection

## Subscription Model

- user room:
  - server automatically adds connection to `user:{userId}` upon successful connection
  - used for account-level notifications

- class room:
  - client calls `SubscribeClass(classId)`
  - client calls `UnsubscribeClass(classId)` when leaving dashboard
  - server validates teacher-owner or active student membership before joining `class:{classId}`

V1 does not support publishing domain writes via hub. All create/update/delete operations still go through REST.

## Client Methods

- server → client:
  - `ReceiveRealtimeEvent(envelope)`

- client → server:
  - `SubscribeClass(classId)`
  - `UnsubscribeClass(classId)`

## Event Envelope

- `eventId`
- `eventType`
- `occurredAtUtc`
- `scope`
  - `user`
  - `class`
- `classId?`
- `actorUserId?`
- `payload`

## Canonical Event Types

- notification:
  - `notification.created`
  - `notification.read`

- post:
  - `post.created`
  - `post.updated`

- comment:
  - `comment.created`
  - `comment.updated`
  - `comment.hidden`

- reaction:
  - `reaction.post.updated`
  - `reaction.comment.updated`

Backend source of truth:

- `examxy.Application/Features/Realtime/RealtimeEventTypes.cs`
- `examxy.Application/Features/Realtime/RealtimeClientMethods.cs`
- `examxy.Application/Features/Realtime/RealtimeScopes.cs`

Frontend mirror:

- `examxy.client/src/features/realtime/lib/realtime-event-types.ts`

## Payload Rules

- `notification.created`
  - payload uses notification inbox DTO shape with deep-link metadata (`featureArea`, `classId`, `postId`, `commentId`, `assessmentId`, `scheduleItemId`)
  - schedule reminders use `featureArea = schedule` and deep-link back to `/classes/{classId}` with the target `scheduleItemId`

- `notification.read`
  - payload includes `notificationIds`, `unreadCount`, `classId?`

- `post.created`, `post.updated`
  - payload uses `ClassPostDto`

- `comment.created`, `comment.updated`
  - payload uses `ClassCommentDto`

- `comment.hidden`
  - payload includes `classId`, `postId`, `commentId`

- `reaction.post.updated`, `reaction.comment.updated`
  - payload includes target metadata and `ClassReactionSummaryDto`

## Current Web Integration

- `RealtimeProvider` initializes the connection after auth session is ready
- class dashboard route `/classes/{classId}` subscribes to class room on mount and unsubscribes on unmount
- client deduplicates events by `eventId`
- class dashboard currently reconciles state by debounced refresh via REST APIs after receiving valid events

## Notes

- REST remains the canonical write path; realtime is only used for state synchronization
- schedule reminder notifications are published to the user room through the same `notification.created` contract; there is no dedicated class-room reminder event
- V1 does not include presence, typing indicators, thread-level read receipts, or a dedicated message broker/event bus
