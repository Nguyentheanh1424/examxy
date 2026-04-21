# Realtime (SignalR)

## Scope

Canonical contract cho realtime server push dung SignalR de dong bo:

- account-level notification inbox
- class feed activity cho post, comment, reaction
- web va mobile app subscription contract

## Transport / Route

- hub route: `/hubs/realtime`
- auth: dung cung JWT scheme voi REST API
- client gui token qua `access_token` query param khi ket noi SignalR

## Subscription Model

- user room:
  - server tu dong add connection vao `user:{userId}` khi connect thanh cong
  - dung cho account-level notifications
- class room:
  - client goi `SubscribeClass(classId)`
  - client goi `UnsubscribeClass(classId)` khi roi dashboard
  - server validate teacher-owner hoac active student membership truoc khi join `class:{classId}`

V1 khong ho tro publish domain writes qua hub. Tat ca create/update/delete van di qua REST.

## Client Methods

- server -> client:
  - `ReceiveRealtimeEvent(envelope)`
- client -> server:
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
  - payload dung notification inbox DTO shape voi deep-link metadata (`featureArea`, `classId`, `postId`, `commentId`, `assessmentId`)
- `notification.read`
  - payload gom `notificationIds`, `unreadCount`, `classId?`
- `post.created`, `post.updated`
  - payload dung `ClassPostDto`
- `comment.created`, `comment.updated`
  - payload dung `ClassCommentDto`
- `comment.hidden`
  - payload gom `classId`, `postId`, `commentId`
- `reaction.post.updated`, `reaction.comment.updated`
  - payload gom target metadata va `ClassReactionSummaryDto`

## Current Web Integration

- `RealtimeProvider` khoi tao connection sau khi auth session san sang
- class dashboard route `/classes/{classId}` subscribe class room khi mount va unsubscribe khi unmount
- client dedupe event theo `eventId`
- class dashboard hien tai reconcile bang cach debounce refresh tu REST APIs sau khi nhan event hop le

## Notes

- REST van la write path canonical; realtime chi dung de push state sync
- V1 chua co presence, typing indicator, read receipt theo thread, hay message broker/event bus rieng
