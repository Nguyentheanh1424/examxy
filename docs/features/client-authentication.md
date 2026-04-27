# Client Authentication

## Purpose

Canonical source of truth for frontend auth/session behavior, auth routes, browser storage rules, and role-based navigation in `examxy.client`.

## Applies when

- You change frontend auth pages, route guards, session bootstrap, login/register/logout flow, or auth-related API client behavior.
- You change confirm-email/reset-password link handling or route/query-string parsing.
- You change how the client persists or refreshes auth state.

## Current behavior / flow

- Auth/client routes:
  - `/login`
  - `/register`
  - `/student/register`
  - `/forgot-password`
  - `/resend-email-confirmation`
  - `/confirm-email?userId=...&token=...`
  - `/reset-password?email=...&token=...`
  - `/teacher/dashboard`
  - `/teacher/classes/new`
  - `/teacher/classes/:classId`
  - `/teacher/classes/:classId/import`
  - `/teacher/question-bank`
  - `/teacher/paper-exams`
  - `/student/dashboard`
  - `/classes/:classId`
  - `/classes/:classId/assessments`
  - `/notifications`
  - `/admin/dashboard`
  - `/account`
- Session model stores `userId`, `userName`, `email`, `roles`, `primaryRole`, `accessToken`, `refreshToken`, `expiresAtUtc`.
- Session persistence:
  - `localStorage` when `remember me` is checked
  - `sessionStorage` when `remember me` is unchecked
- Session bootstrap flow:
  1. load stored session
  2. if no session, become anonymous
  3. if token pair exists, call `POST /api/auth/refresh-token`
  4. on success, store new session and become authenticated
  5. on failure, clear browser storage and return to anonymous
- Protected request flow:
  1. attach bearer token
  2. on `401`, refresh once
  3. retry once on refresh success
  4. clear local session on refresh failure
- Role routing uses `primaryRole`:
  - `Teacher` -> `/teacher/dashboard`
  - `Student` -> `/student/dashboard`
  - `Admin` -> `/admin/dashboard`
- Role-gated pilot workspaces:
  - teacher: question bank, paper-exam templates, class create/import, class assessment publish/results
  - student: class assessment attempt flow
  - shared authenticated: account inbox, class dashboard, class assessment route shell

## Invariants

- `primaryRole` remains the routing signal; the client should not infer a default route from `roles` alone.
- `remember me` is only a browser persistence choice until backend contracts change explicitly.
- Confirm-email and reset-password keep reading URL-safe tokens from query-string links.
- API error mapping continues to normalize backend field errors for frontend form usage.
- Backend remains the final authz gate; frontend guards and redirects are only UX and routing aids.

## Change checklist

- Route, bootstrap, or session-storage behavior change -> update router/auth-context code, page tests, and this doc
- Backend auth contract change -> update this doc and verify `docs/features/authentication.md` already reflects it
- Error mapping change -> update `docs/features/error-handling.md` and API client tests
- Dashboard route or role visibility change -> update `docs/features/frontend-flow-class-dashboard.md`

## Related

- Code:
  - `examxy.client/src/app/router.tsx`
  - `examxy.client/src/features/auth/auth-context.tsx`
  - `examxy.client/src/features/auth/lib/auth-api.ts`
  - `examxy.client/src/features/auth/lib/auth-role-routing.ts`
  - `examxy.client/src/lib/http/api-client.ts`
- Tests:
  - `examxy.client/src/features/auth/auth-context.test.tsx`
  - `examxy.client/src/features/auth/pages/auth-pages.test.tsx`
  - `examxy.client/src/features/auth/pages/login-page.test.tsx`
  - `examxy.client/src/features/auth/components/protected-route.test.tsx`
- Docs:
  - `docs/features/authentication.md`
  - `docs/features/error-handling.md`
  - `docs/features/frontend-flow-class-dashboard.md`
