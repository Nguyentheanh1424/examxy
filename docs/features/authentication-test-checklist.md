# Authentication API Test Checklist

## Current Status

- Test file: `test.Integration/Auth/AuthApiTests.cs`
- Test file: `test.Integration/Auth/ClassroomApiTests.cs`
- Test file: `test.Integration/Auth/InternalAdminApiTests.cs`
- Test file: `test.Integration/Auth/IdentityRoleMigrationTests.cs`
- Config guard tests: `test.Integration/Auth/InfrastructureConfigurationTests.cs`
- Test host: `WebApplicationFactory<Program>` + SQLite test database + in-memory `IEmailSender`
- Auth email templates are asserted at the subject + text body (link/token level)
- Test assembly has parallelization disabled to avoid env/config conflicts in the test host
- Verification commands:

```powershell
dotnet test .\test.Integration\test.Integration.csproj
dotnet test .\examxy.slnx
```

## APIs Covered by Tests

- [x] `POST /api/auth/register`
  - success returns token and `primaryRole = Teacher`
  - creates unconfirmed user
  - creates `TeacherProfile`
  - sends confirmation email via fake sender with standardized subject/body
  - validation error returns `400`
  - duplicate username returns `409`
  - duplicate email returns `409`

- [x] `POST /api/auth/register/student`
  - success returns token and `primaryRole = Student`
  - creates `StudentProfile`
  - new student can access an empty dashboard

- [x] `POST /api/auth/login`
  - unconfirmed email returns `403`
  - invalid password returns `401`
  - confirmed user can log in successfully
  - auth response includes `primaryRole`
  - lockout after multiple failures returns `403`

- [x] `POST /api/auth/refresh-token`
  - valid token pair returns new tokens

- [x] `POST /api/auth/logout`
  - missing access token returns `401`
  - refresh token is revoked and old refresh returns `401`
  - refresh token not belonging to authenticated user returns `403`

- [x] `GET /api/auth/me`
  - valid bearer token returns current user
  - includes `primaryRole`

- [x] `POST /api/auth/change-password`
  - password change succeeds
  - old password cannot be used to log in again
  - old refresh token is revoked

- [x] `POST /api/auth/forgot-password`
  - non-existing email still returns `204`
  - unconfirmed email returns `204` and does not send email
  - confirmed email returns `204` and sends reset email with standardized subject/body

- [x] `POST /api/auth/reset-password`
  - URL-safe token from reset email successfully resets password

- [x] `POST /api/auth/confirm-email`
  - URL-safe token from confirmation email successfully confirms email

- [x] `POST /api/auth/resend-email-confirmation`
  - unconfirmed user returns `204` and sends email with standardized subject/body
  - confirmed user returns `204` and does not send email

- [x] `GET /api/classes`
  - teacher retrieves their class list

- [x] `POST /api/classes`
  - teacher successfully creates a class

- [x] `GET /api/classes/{classId}`
  - teacher can view their own class
  - teacher cannot view another teacher’s class

- [x] `POST /api/classes/{classId}/roster-imports`
  - importing new email creates invited student account + invite + email dispatch
  - importing existing student only creates a new invite
  - importing existing teacher/admin is correctly rejected per row

- [x] `GET /api/student/dashboard`
  - new student without classes still receives an empty dashboard

- [x] `POST /api/student/invites/claim`
  - invite can only be used once
  - invite can only be claimed by account with matching email
  - successful claim creates `Active` membership

- [x] `POST /internal/admin-users`
  - missing secret header is rejected
  - valid secret successfully provisions admin account

## Migration and Seed Tests

- [x] legacy role `User` is backfilled to `Teacher`
- [x] new roles seeded correctly: `Teacher`, `Student`, `Admin`
- [x] teacher/student profiles are created in sync with users when needed

## Verified Manual E2E

- [x] Brevo SMTP sends real confirmation email in Development
- [x] confirmation link in email works correctly
- [x] Brevo SMTP sends real reset email in Development
- [x] reset link in email works correctly
- [x] login with old password returns `401` after reset
- [x] login with new password returns `200` after reset

## Config / Startup Tests

- [x] missing `Email` section fails startup with `InvalidOperationException`
- [x] invalid `AppUrls:FrontendBaseUrl` fails startup with `InvalidOperationException`
- [x] missing `AppUrls:StudentDashboardPath` fails startup with `InvalidOperationException`
- [x] missing `InternalAdminProvisioning` fails startup with `InvalidOperationException`

## Notes

- Integration tests do not call real SMTP; instead they use `InMemoryEmailSender` to assert subject, recipient, and link/token in the body.
- Because email templates now include line breaks and clearer fallback text, test parsers should extract URLs using patterns instead of splitting by whitespace.
- `reset-password` and `confirm-email` now consume URL-encoded tokens, so success tests must extract tokens from email bodies instead of generating raw tokens via `UserManager`.
- Test host uses `DatabaseProvider=Sqlite`; if Infrastructure wiring changes later, this provider must remain functional for test branches.
- `logout` currently requires both bearer access token and refresh token; tests already cover both happy path and owner mismatch cases.
- Classroom/import tests have email side effects; if email templates or onboarding links change, parsers and assertions must be updated accordingly.
- Internal admin APIs are not public in Swagger, but still require integration tests due to dependency on secret config.

## Suggested Next Improvements

- When implementing external auth/OAuth, follow `docs/features/authentication-backend-gaps.md` and add integration tests for provider list, start, callback, and stable error codes.
- Add tests for `404` cases in `refresh-token`, `reset-password`, and `confirm-email` to fully match documented status behavior.
- Add tests for `401` when calling `GET /api/auth/me` or `POST /api/auth/change-password` without bearer token.
- Add tests for register failure when email sender throws exception to verify rollback behavior of user creation.
- Add a visual review checklist for HTML email if templates become more complex.
- Add integration tests for `PUT`/`DELETE` class and expired invite paths when those flows are expanded.
