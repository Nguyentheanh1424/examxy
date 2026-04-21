# Authentication

## Purpose
Canonical source of truth for backend auth and identity behavior: `/api/auth/*`, token handling, email auth flows, and auth-facing config assumptions.

## Applies when
- You change login, register, logout, refresh-token, current-user, change-password, forgot/reset password, confirm-email, or resend-email-confirmation behavior.
- You change auth DTOs, token policy, email auth flow, or auth-related config contracts.
- You change internal admin user provisioning or auth-facing role claims.

## Current behavior / flow
- Current actors:
  - `Teacher`
  - `Student`
  - `Admin`
- Public auth endpoints:
  - `POST /api/auth/register`
  - `POST /api/auth/register/student`
  - `POST /api/auth/login`
  - `POST /api/auth/refresh-token`
  - `POST /api/auth/logout`
  - `GET /api/auth/me`
  - `POST /api/auth/change-password`
  - `POST /api/auth/forgot-password`
  - `POST /api/auth/reset-password`
  - `POST /api/auth/confirm-email`
  - `POST /api/auth/resend-email-confirmation`
- Internal identity endpoint:
  - `POST /internal/admin-users`
- Current backend behavior:
  - teacher register creates a `Teacher` account, sends email confirmation, and returns a token pair
  - student register creates a `Student` account and student profile, then returns a token pair
  - login requires confirmed email
  - confirm-email and reset-password consume URL-safe tokens from frontend links
  - refresh tokens are stored in `RefreshTokens`
  - `primaryRole` is returned in auth responses and `GET /api/auth/me`
- `remember me` is not a backend contract today; refresh-token policy is not split by persistent vs non-persistent login

## Invariants
- `primaryRole` stays in auth responses so the client does not infer a default route from `roles`.
- Login for unconfirmed email remains blocked.
- Confirm-email and reset-password keep using URL-safe tokens from the frontend link.
- Auth endpoints use the shared API error contract from `docs/features/error-handling.md`.
- If backend behavior for `remember me` changes, the contract must change explicitly; do not infer it from browser storage alone.

## Change checklist
- Auth contract change -> update Application DTOs/interfaces, Infrastructure auth services, Server controllers/OpenAPI, and `docs/features/client-authentication.md`
- Token or email auth flow change -> update `docs/features/api-flow-authentication.md`, `docs/runbooks/local-development.md`, and `docs/features/authentication-test-checklist.md`
- Role claim or auth response change -> update `docs/features/identity-class-foundation.md`, `docs/features/client-authentication.md`, and integration tests
- Error/status change -> update `docs/features/error-handling.md`

## Related
- Code:
  - `examxy.Application/Abstractions/Identity/*`
  - `examxy.Infrastructure/Identity/Services/*`
  - `examxy.Infrastructure/Email/*`
  - `examxy.Server/Controllers/AuthController.cs`
  - `examxy.Server/Controllers/InternalAdminUsersController.cs`
- Tests:
  - `test.Integration/Auth/AuthApiTests.cs`
  - `docs/features/authentication-test-checklist.md`
- Docs:
  - `docs/features/client-authentication.md`
  - `docs/features/error-handling.md`
  - `docs/features/api-flow-authentication.md`
  - `docs/features/identity-class-foundation.md`
