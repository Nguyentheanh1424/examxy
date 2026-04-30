# Frontend Flow - Teacher Dashboard

## Purpose

Define planned UI pattern migration for the teacher dashboard.

This document is planning guidance. Runtime UI migration has not shipped yet.

## Source files

| Type | Path |
|---|---|
| Real route | `/teacher/dashboard` |
| Real page | `examxy.client/src/features/teacher/pages/teacher-dashboard-page.tsx` |
| Real API | `examxy.client/src/features/classrooms/lib/class-api.ts` |
| Real types | `examxy.client/src/types/classroom.ts` |
| Real tests | No dedicated page test found before phase 1 |
| tmp reference | `examxy.client/src/tmp/dashboards/TeacherDashboard.tsx` |

## Current behavior to preserve

- Keep `getTeacherClassesRequest()`.
- Keep route `/teacher/dashboard` protected for `Teacher`.
- Keep current route targets for notifications, account, class creation, class open, assessments, imports, question bank, and paper exams.
- Keep current loading and error behavior or replace it with behavior-equivalent richer states.
- Do not add fake activity, fake analytics, or mock class summaries.

## Candidate tmp patterns

| Pattern | Decision | Data support | Notes |
|---|---|---|---|
| Metric cards | Candidate | Current `TeacherClassSummary[]` only | Derive active class count, active students, and pending invites from loaded classes. |
| CTA hierarchy | Candidate | Existing routes | Keep existing valid route targets. |
| Class card polish | Candidate | Current class response | Preserve open class, assessments, and import actions. |
| Recent activity | Backlog | No current dashboard activity API | Do not fake. |
| Rich empty state | Candidate | Supported | CTA must use existing create class route. |
| Loading skeleton | Candidate | Supported | Must keep error state visible. |

## Acceptance criteria

- Metrics are traceable to current API response fields.
- No fake dashboard numbers are introduced.
- Existing CTAs remain valid and role-safe.
- Route and auth behavior remain unchanged.
- GitNexus impact is rerun before editing `TeacherDashboardPage`.

## Related

- `docs/features/figma-ui-migration-phase-1.md`
- `docs/features/identity-class-foundation.md`
- `docs/features/api-flow-classrooms.md`
