# Identity + Class Foundation

## Purpose
Canonical source of truth for the role model, class ownership/membership/invite foundation, and the authorization boundary shared by classroom modules.

## Applies when
- You change roles, `primaryRole`, class ownership, membership, invites, roster import, or student onboarding into classes.
- You change `/api/classes/*` foundation routes or `/api/student/*` invite/dashboard foundation routes.
- You change the entity relationships that support teacher/student/class foundation behavior.

## Current behavior / flow
- Role model:
  - `Teacher`: public register flow and owner of class/foundation/content/assessment mutations
  - `Student`: self-signup or teacher invite/import, then joins classes through onboarding/invite claim
  - `Admin`: internal provisioning only
- Foundation entities:
  - `ApplicationUser`
  - `TeacherProfile`
  - `StudentProfile`
  - `Classroom`
  - `ClassMembership`
  - `ClassInvite`
  - `StudentImportBatch`
  - `StudentImportItem`
- Foundation routes:
  - `GET /api/classes`
  - `POST /api/classes`
  - `GET /api/classes/{classId}`
  - `PUT /api/classes/{classId}`
  - `DELETE /api/classes/{classId}`
  - `POST /api/classes/{classId}/roster-imports`
  - `POST /api/classes/{classId}/students`
  - `DELETE /api/classes/{classId}/memberships/{membershipId}`
  - `POST /api/classes/{classId}/invites/{inviteId}/resend`
  - `POST /api/classes/{classId}/invites/{inviteId}/cancel`
  - `GET /api/student/dashboard`
  - `POST /api/student/invites/claim`
- Authorization model:
  - role policy guard at API/controller level
  - class ownership or active membership guard at service level
  - frontend only uses role info for route and UI visibility

## Invariants
- `primaryRole` remains the single canonical role signal for frontend routing.
- Teacher owner is the only actor allowed to mutate class foundation metadata and roster state.
- Student must be an active member to access student class behavior.
- Backend remains the final authorization gate; frontend visibility is not an enforcement layer.
- Content, question bank, and assessment feature docs own their deeper behavior; this doc owns only the shared role/foundation boundary.

## Change checklist
- Role model or `primaryRole` change -> update `docs/features/authentication.md`, `docs/features/client-authentication.md`, and integration tests
- Foundation route or ownership/membership rule change -> update `docs/features/api-flow-classrooms.md`, `docs/architecture/database-erd.md`, and `docs/context/current-state.md`
- Entity relationship or lifecycle field change -> update Domain/Infrastructure code, database ERD, and related feature docs

## Related
- Code:
  - `examxy.Domain/Classrooms/*`
  - `examxy.Infrastructure/Features/Classrooms/*`
  - `examxy.Server/Controllers/TeacherClassesController.cs`
  - `examxy.Server/Controllers/StudentDashboardController.cs`
  - `examxy.Server/Controllers/StudentInvitesController.cs`
- Docs:
  - `docs/features/authentication.md`
  - `docs/features/api-flow-classrooms.md`
  - `docs/architecture/database-erd.md`
  - `docs/context/current-state.md`
