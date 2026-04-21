# Frontend Flow - Class Dashboard

## Purpose
Canonical source of truth for the frontend class dashboard route, role-based UI visibility, state flow, and action-to-API mapping.

## Applies when
- You change the UI or route behavior of `/classes/{classId}`.
- You change role-based visibility for teacher vs student dashboard actions.
- You change dashboard loading, empty, error, or success states.

## Current behavior / flow
- Canonical route: `/classes/{classId}`
- Allowed roles: `Teacher`, `Student`
- Legacy route `/teacher/classes/{classId}` redirects to the canonical route
- Shared layout blocks:
  - header with class metadata and quick stats
  - feed section
  - schedule section
  - optional side panel for upcoming schedule and unread notifications
- Role visibility:
  - teacher can create/update post, hide comment, create/update schedule item
  - student can view, comment, and react when membership is valid
- State flow:
  - dashboard, feed, and schedule each expose loading, empty, error, and success states
  - class dashboard subscribes SignalR room `class:{classId}` while route is mounted
  - account-level notification events tied to the same `classId` also trigger dashboard reconciliation
  - realtime events debounce a refresh of canonical REST data instead of mutating permanent dashboard state blindly
- Action to API mapping:
  - dashboard summary -> `GET /api/classes/{classId}/dashboard`
  - feed -> `GET /api/classes/{classId}/feed`
  - mention candidates -> `GET /api/classes/{classId}/mention-candidates`
  - post/comment/reaction/schedule actions -> matching `POST`, `PUT`, `DELETE` routes under `/api/classes/{classId}`
  - realtime sync -> SignalR `/hubs/realtime`, `SubscribeClass(classId)`, `UnsubscribeClass(classId)`, `ReceiveRealtimeEvent(envelope)`

## Invariants
- `/classes/{classId}` is the canonical dashboard route.
- Backend remains the final permission gate; frontend role logic only controls UI visibility and routing.
- Teacher and student share the dashboard shell; differences are action availability and state messaging.
- Reaction and mention UI should not mutate local state permanently until the API call succeeds.
- Realtime event names in the client must come from shared constants, not inline string literals.

## Change checklist
- Route or visibility change -> update router code, this doc, and feature tests
- API shape change -> update this doc and the owning backend feature doc or flow doc
- Shared state-flow change -> update dashboard page tests and any related shared UI docs if the UI contract changes
- Realtime subscription or reconciliation change -> update this doc, `docs/features/realtime.md`, and dashboard tests

## Related
- Code:
  - `examxy.client/src/app/router.tsx`
  - `examxy.client/src/features/class-dashboard/pages/class-dashboard-page.tsx`
- Tests:
  - `examxy.client/src/features/class-dashboard/pages/class-dashboard-page.test.tsx`
- Docs:
  - `docs/features/class-dashboard-content.md`
  - `docs/features/api-flow-class-content.md`
