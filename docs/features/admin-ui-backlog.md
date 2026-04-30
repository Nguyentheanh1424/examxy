# Admin UI Backlog

## Purpose

Track admin prototype pages from `examxy.client/src/tmp` that are not part of phase 1 Figma UI migration.

Admin runtime routes must not be mock-backed. Document API gaps before implementation.

## Backlog items

| Prototype | Desired route | Required API | Current support | Decision |
|---|---|---|---|---|
| `examxy.client/src/tmp/admin/AdminUsersPage.tsx` | `/admin/users` | List users, inspect roles, update role/status, handle paging/filtering | Not confirmed for runtime UI | Backlog / Needs API |
| `examxy.client/src/tmp/admin/AdminAuditLogPage.tsx` | `/admin/audit` | Query audit events, filter by actor/module/severity/date, inspect event detail | Not confirmed | Backlog / Needs API |
| `examxy.client/src/tmp/admin/AdminSystemHealthPage.tsx` | `/admin/system-health` | Read service health/status, latency, uptime, incidents or diagnostics | Not confirmed | Backlog / Needs API |
| `examxy.client/src/tmp/dashboards/AdminDashboard.tsx` | `/admin/dashboard` | Dashboard metrics beyond current minimal admin page | Minimal admin route exists | Docs only until API scope is defined |

## Rules

- Do not implement mock-backed admin routes.
- Do not add admin runtime routes unless real API support exists.
- Do not infer admin permissions from prototype UI; backend auth policy remains authoritative.
- Document API contracts and update `docs/features/api-flow-internal-admin.md` before implementing admin CRUD or audit behavior.
- Keep phase 1 migration focused on Question Bank, Teacher Dashboard, Paper Exams, Class Dashboard, Assessments, and Notifications.

## Related

- `docs/features/api-flow-internal-admin.md`
- `docs/features/figma-ui-migration-phase-1.md`
- `docs/features/tmp-to-real-ui-mapping.md`
