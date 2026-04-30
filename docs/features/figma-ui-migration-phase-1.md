# Phase 1 Figma UI Pattern Migration

## Summary

Phase 1 migrates selected UI patterns from `examxy.client/src/tmp` into real feature pages while preserving real behavior, APIs, auth guards, realtime behavior, error handling, tests, and routes.

This plan is not shipped runtime behavior. Runtime migration starts in later implementation batches.

## In scope

- Question Bank
- Teacher Dashboard
- Paper Exams
- Class Dashboard
- Class Assessments
- Notifications

## Out of scope

- Runtime imports from `src/tmp`
- Mock-backed UI in real pages
- Admin routes
- Broad Vietnamese copy rewrite
- Deep mobile-first redesign
- Backend/API contract changes unless separately documented
- Reintroducing prototype `components/eds` or prototype `AppShell`

## Batch order

1. Question Bank
2. Teacher Dashboard
3. Paper Exams
4. Class Dashboard and Class Assessments
5. Notifications
6. Current-state docs finalization only after runtime UI ships

## Shared acceptance criteria

- No runtime import from `src/tmp`.
- No mock data introduced into real pages.
- No replacement of real API behavior with local mock behavior.
- No loss of auth guards, role guards, realtime behavior, API error mapping, or route behavior.
- No dependency on `components/eds` or prototype `AppShell`.
- UI copy is readable and encoding-safe.
- Existing behavior tests remain valid; new UI interactions add focused tests where needed.
- `npm run lint`, `npm run test:run`, and `npm run build` pass for each implementation batch.
- GitNexus impact is run before editing each page/symbol.
- GitNexus detect changes is run before commit.

## Phase 1 inspection baseline

| Page symbol | Real file | Route | Related tests | Related API/types | GitNexus impact | Known risk |
|---|---|---|---|---|---|---|
| `QuestionBankPage` | `examxy.client/src/features/question-bank/pages/question-bank-page.tsx` | `/teacher/question-bank` | No dedicated page test found | `question-bank-api.ts`, `types/question-bank.ts` | LOW | Filters/tabs must not imply server filtering or unsupported restore behavior. |
| `TeacherDashboardPage` | `examxy.client/src/features/teacher/pages/teacher-dashboard-page.tsx` | `/teacher/dashboard` | No dedicated page test found | `class-api.ts`, `types/classroom.ts` | LOW | Metrics must derive only from current class summary fields. |
| `PaperExamTemplatesPage` | `examxy.client/src/features/paper-exams/pages/paper-exam-templates-page.tsx` | `/teacher/paper-exams` | `paper-exam-templates-page.test.tsx` | `paper-exam-api.ts`, `types/paper-exam.ts` | LOW | Version state, query selection, asset upload, validate/publish/clone ordering. |
| `ClassDashboardPage` | `examxy.client/src/features/class-dashboard/pages/class-dashboard-page.tsx` | `/classes/:classId` | `class-dashboard-page.test.tsx` | `class-content-api.ts`, `types/class-content.ts`, realtime types | LOW | Realtime reconciliation, permissions, mentions, reactions, schedule deep links. |
| `ClassAssessmentsPage` | `examxy.client/src/features/assessments/pages/class-assessments-page.tsx` | `/classes/:classId/assessments` | `class-assessments-page.test.tsx` | `assessment-api.ts`, `paper-exam-api.ts`, assessment/paper-exam types | LOW | Teacher/student visibility, publish/results, paper binding and review flows. |
| `NotificationsPage` | `examxy.client/src/features/notifications/pages/notifications-page.tsx` | `/notifications` | `notifications-page.test.tsx` | `notification-api.ts`, `types/notification.ts`, realtime types | LOW | Deep-link building, read/unread state, class/unread filters, SignalR refresh. |

## Implementation handoff

Use the feature frontend-flow doc for the next batch before editing runtime code.

Batch 1 handoff:

`Implement Question Bank UI migration using docs/features/frontend-flow-question-bank.md as source of truth. Preserve existing API behavior, route behavior, auth, error handling, and tests. Use src/tmp only as reference UI and do not import from it.`

## Related

- `docs/features/tmp-to-real-ui-mapping.md`
- `docs/features/frontend-flow-question-bank.md`
- `docs/conventions/frontend-source-of-truth.md`
