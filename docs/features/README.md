# Features Docs Index

Trang nay la entrypoint cho team backend + frontend khi implement feature moi.

## Foundation

- [identity-class-foundation.md](identity-class-foundation.md)
  - role model (`Teacher`, `Student`, `Admin`)
  - class ownership + membership + invite + roster import
  - route convention `/api/classes/*`

- [authentication.md](authentication.md)
- [client-authentication.md](client-authentication.md)
- [error-handling.md](error-handling.md)

## Classroom Dashboard & Content

- [class-dashboard-content.md](class-dashboard-content.md)
  - domain model post/comment/reaction/mention/notification/schedule
  - authz rule by role + membership
  - DB schema + API contract

- [api-flow-class-content.md](api-flow-class-content.md)
  - sequence post/comment/reaction/tag/notify
  - idempotent notification key behavior

## Question Bank & Assessments

- [question-bank-assessments.md](question-bank-assessments.md)
  - teacher-global question bank model/version/tag
  - class assessment lifecycle + publish lock + attempt + auto-grade
  - DB schema + API contract

- [api-flow-assessment.md](api-flow-assessment.md)
  - create/update/publish flow
  - student attempt/save/submit/score flow

## API Flow (Cross Module)

- [api-flow-authentication.md](api-flow-authentication.md)
- [api-flow-classrooms.md](api-flow-classrooms.md)
- [api-flow-internal-admin.md](api-flow-internal-admin.md)

## Frontend Implementation Flow

- [frontend-flow-class-dashboard.md](frontend-flow-class-dashboard.md)
  - shared class dashboard layout cho teacher/student
  - role-based UI visibility matrix
  - loading/empty/error/success state flow
  - action -> API mapping
  - DTO contract FE can rely on

## Suggested Reading Order

1. Boundary + architecture:
   - `docs/architecture/solution-map.md`
   - `docs/context/current-state.md`
2. Foundation:
   - `identity-class-foundation.md`
3. New class dashboard/content:
   - `class-dashboard-content.md`
   - `api-flow-class-content.md`
4. Question bank + assessment:
   - `question-bank-assessments.md`
   - `api-flow-assessment.md`
5. FE execution:
   - `frontend-flow-class-dashboard.md`
