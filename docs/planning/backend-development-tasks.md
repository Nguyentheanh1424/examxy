# Backend Development Tasks

## Purpose

Implementation-ready backend task breakdown derived from the current docs and code state. This file is for backlog planning and follow-up work; shipped behavior and constraints remain owned by `docs/context/current-state.md` and the relevant feature docs.

## Review date

2026-04-27

## How to use

- Treat each task as one focused PR or one focused agent task.
- Read the listed docs before touching code.
- Update tests and canonical docs in the same task when behavior, API shape, config, persistence, or workflow changes.
- Priorities are planning priorities, not release gates; a `P1` task can be done before a `P0` task when it is the active product need.

## Task format

Each task includes:

- `ID`
- `Priority`
- `Module`
- `Objective`
- `Scope`
- `Docs to read first`
- `Expected output`
- `Verification`

## P0 Docs/contract cleanup

### BE-DOC-001 Auth backend gap doc drift

- `Priority`: P0
- `Module`: Authentication
- `Objective`: Update `docs/features/authentication-backend-gaps.md` so it no longer says login lacks machine-readable error codes that already exist.
- `Scope`: Docs only; do not change auth behavior.
- `Docs to read first`: `docs/features/authentication.md`, `docs/features/authentication-backend-gaps.md`, `docs/features/error-handling.md`.
- `Expected output`: Gap doc distinguishes implemented login codes (`invalid_credentials`, `email_confirmation_required`, `account_locked`) from still-missing external auth codes (`external_auth_not_configured`, `external_auth_failed`) and provider discovery/start/callback APIs.
- `Verification`: `rg "invalid_credentials|email_confirmation_required|account_locked" docs/features/authentication-backend-gaps.md` shows the codes are described as existing.

### BE-DOC-002 Notification inbox naming cleanup

- `Priority`: P0
- `Module`: Notifications
- `Objective`: Resolve naming drift where notification inbox abstractions live in files named for class notifications.
- `Scope`: Rename or document `IClassNotificationService.cs` and `ClassNotificationService.cs` so file names match `INotificationInboxService` and `NotificationInboxService`; keep public API behavior unchanged.
- `Docs to read first`: `docs/features/notifications.md`, `docs/features/class-dashboard-content.md`, `docs/architecture/solution-map.md`.
- `Expected output`: Names, docs, and DI registration consistently describe account-level notification inbox behavior.
- `Verification`: `dotnet build .\examxy.Server\examxy.Server.csproj` and `dotnet test .\test.Integration\test.Integration.csproj`.

### BE-DOC-003 Identity bootstrap and seeding cleanup

- `Priority`: P0
- `Module`: Authentication / Internal admin
- `Objective`: Decide whether legacy `IdentitySeeder` is still owned runtime code or should be removed/replaced by current bootstrap and internal maintenance flows.
- `Scope`: Audit `IdentitySeeder`, `IdentityBootstrapService`, `IdentitySeed:*` config, and internal identity administration endpoints; remove or document unused paths without changing admin provisioning semantics.
- `Docs to read first`: `docs/features/authentication.md`, `docs/features/api-flow-internal-admin.md`, `docs/runbooks/local-development.md`.
- `Expected output`: One documented identity bootstrap/provisioning path; no misleading unused admin seed config remains in runtime docs/config.
- `Verification`: `dotnet build .\examxy.Server\examxy.Server.csproj` and internal admin integration tests.

## P1 Assessment completion

### BE-ASM-001 Enforce assessment time limit

- `Priority`: P1
- `Module`: Assessments
- `Objective`: Make `TimeLimitMinutes` affect attempt submission/edit behavior instead of being metadata only.
- `Scope`: Enforce expiry from `StartedAtUtc + TimeLimitMinutesSnapshot`; return shared API error responses for expired attempts.
- `Docs to read first`: `docs/features/question-bank-assessments.md`, `docs/features/api-flow-assessment.md`, `docs/features/error-handling.md`.
- `Expected output`: Student cannot save or submit an expired timed attempt; untimed assessments keep current behavior.
- `Verification`: Add integration coverage for save/submit before and after expiry.

### BE-ASM-002 Implement random question order

- `Priority`: P1
- `Module`: Assessments
- `Objective`: Honor `QuestionOrderMode = Random` for student attempts.
- `Scope`: Persist or return a stable per-attempt item order so refreshes do not reshuffle an in-progress attempt.
- `Docs to read first`: `docs/features/question-bank-assessments.md`, `docs/features/api-flow-assessment.md`, `docs/architecture/database-erd.md`.
- `Expected output`: Fixed mode preserves configured order; random mode gives each attempt a stable randomized order.
- `Verification`: Add tests for fixed order, random order stability, and no content drift after publish.

### BE-ASM-003 Enforce score and answer release modes

- `Priority`: P1
- `Module`: Assessments
- `Objective`: Make `ShowAnswersMode` and `ScoreReleaseMode` control what students can see after submission.
- `Scope`: Add or adjust read endpoints/DTOs so answer keys and scores are hidden or visible according to the configured mode.
- `Docs to read first`: `docs/features/question-bank-assessments.md`, `docs/features/api-flow-assessment.md`, `docs/features/client-authentication.md`.
- `Expected output`: Students only receive score/answer detail allowed by `Immediate`, `AfterCloseAt`, `AfterSubmit`, `Hidden`, or `TeacherManual` policies.
- `Verification`: Add integration tests for each release mode that is API-visible.

### BE-ASM-004 Manual grading for non-objective questions

- `Priority`: P1
- `Module`: Assessments
- `Objective`: Add teacher review/grading for `MediaBased` and `MathFormula` answers.
- `Scope`: Introduce teacher-owned grading API, persist manual points/comments, and transition attempts from `NeedsReview` to final graded state.
- `Docs to read first`: `docs/features/question-bank-assessments.md`, `docs/features/api-flow-assessment.md`, `docs/architecture/database-erd.md`.
- `Expected output`: Non-objective answers can be reviewed without overloading offline paper-exam review flows.
- `Verification`: Add teacher authorization, score aggregation, and status transition integration tests.

## P1 Paper exam hardening

### BE-PAPER-001 Configure paper exam storage provider

- `Priority`: P1
- `Module`: Paper exams
- `Objective`: Move local paper-exam storage behind explicit options so runtime storage behavior is not hardcoded to `App_Data`.
- `Scope`: Add storage options for provider/root path; keep local provider as default for development/testing.
- `Docs to read first`: `docs/features/paper-exams-offline.md`, `docs/runbooks/local-development.md`, `docs/architecture/solution-map.md`.
- `Expected output`: Storage location and provider are documented and validated at startup.
- `Verification`: Add configuration tests for missing/invalid storage options and a local provider smoke test.

### BE-PAPER-002 Validate scanner payload and policy JSON

- `Priority`: P1
- `Module`: Paper exams
- `Objective`: Strengthen validation for scanner submissions and binding policy JSON.
- `Scope`: Validate config hash, schema version, metadata requirements, policy shape, recognized answer ranges, and duplicate question numbers before persistence.
- `Docs to read first`: `docs/features/paper-exams-offline.md`, `docs/features/error-handling.md`, `docs/architecture/database-erd.md`.
- `Expected output`: Invalid scanner payloads return deterministic validation/conflict errors and do not create partial submissions.
- `Verification`: Add tests for malformed metadata, duplicate answers, invalid question numbers, schema mismatch, and config mismatch.

### BE-PAPER-003 Expand paper exam idempotency and resubmission coverage

- `Priority`: P1
- `Module`: Paper exams
- `Objective`: Cover binding/config/schema conflict and resubmission behavior with focused integration tests.
- `Scope`: Tests only unless the tests expose behavior drift.
- `Docs to read first`: `docs/features/paper-exams-offline.md`, `docs/features/api-flow-assessment.md`.
- `Expected output`: Clear regression coverage for binding version mismatch, config hash mismatch, schema mismatch, duplicate submit with `allowResubmit=false`, and replacement submit with `allowResubmit=true`.
- `Verification`: `dotnet test .\test.Integration\test.Integration.csproj`.

## P1 Notifications/reminders

### BE-NOTIF-001 Support configurable reminder lead times

- `Priority`: P1
- `Module`: Notifications
- `Objective`: Replace the fixed 24h reminder assumption with configured lead times.
- `Scope`: Extend reminder options and notification keys/types as needed while preserving current 24h default behavior.
- `Docs to read first`: `docs/features/notifications.md`, `docs/features/class-dashboard-content.md`, `docs/runbooks/local-development.md`.
- `Expected output`: Reminder processor can emit configured reminder windows without duplicate notifications.
- `Verification`: Add processor tests for multiple lead times and idempotency.

### BE-NOTIF-002 Handle reminder update and revoke behavior

- `Priority`: P1
- `Module`: Notifications
- `Objective`: Define and implement what happens to already-created reminders when a schedule item changes or is deleted.
- `Scope`: Update reminder processing and schedule item lifecycle behavior for reschedule, delete, and close cases.
- `Docs to read first`: `docs/features/notifications.md`, `docs/features/class-dashboard-content.md`, `docs/features/realtime.md`.
- `Expected output`: Users do not keep stale reminder notifications after schedule changes covered by the task.
- `Verification`: Add tests for reschedule before dispatch, reschedule after dispatch, and deleted schedule item behavior.

### BE-NOTIF-003 Plan email and push delivery channels

- `Priority`: P1
- `Module`: Notifications
- `Objective`: Separate delivery-channel planning from the existing in-app inbox and SignalR event path.
- `Scope`: Produce a decision note or feature doc update that defines email/push channel ownership, retry policy, user preferences, and provider boundaries before implementation.
- `Docs to read first`: `docs/features/notifications.md`, `docs/features/realtime.md`, `docs/decisions/README.md`.
- `Expected output`: A decision-complete delivery channel plan; no production channel implementation required in this task.
- `Verification`: Docs review only.

## P2 Class content lifecycle

### BE-CLASS-001 Clarify or implement scheduled publish

- `Priority`: P2
- `Module`: Class content
- `Objective`: Resolve future `PublishAtUtc` semantics for posts.
- `Scope`: Either add a publish worker that transitions eligible drafts, or document/API-adjust that teachers must explicitly publish scheduled posts.
- `Docs to read first`: `docs/features/class-dashboard-content.md`, `docs/features/realtime.md`, `docs/context/current-state.md`.
- `Expected output`: Student visibility and teacher scheduling behavior are unambiguous and tested.
- `Verification`: Add tests for future publish visibility before and after the scheduled time.

### BE-CLASS-002 Add post and schedule deletion APIs

- `Priority`: P2
- `Module`: Class content
- `Objective`: Complete lifecycle APIs for posts and schedule items.
- `Scope`: Add teacher-owned soft-delete behavior and REST endpoints for posts and schedule items; publish realtime events when needed.
- `Docs to read first`: `docs/features/class-dashboard-content.md`, `docs/features/realtime.md`, `docs/features/error-handling.md`.
- `Expected output`: Teachers can remove posts and schedule items without hard-deleting audit-relevant records.
- `Verification`: Add authorization and visibility integration tests.

### BE-CLASS-003 Add first-class attachment storage

- `Priority`: P2
- `Module`: Class content
- `Objective`: Replace metadata-only external URL attachments with backend-managed upload/storage when required by product scope.
- `Scope`: Define storage contract, upload endpoint, file metadata, access control, and download route.
- `Docs to read first`: `docs/features/class-dashboard-content.md`, `docs/architecture/solution-map.md`, `docs/runbooks/local-development.md`.
- `Expected output`: Attachments are stored and served through authenticated backend routes.
- `Verification`: Add upload/download authorization and metadata tests.

## P2 Admin/ops

### BE-ADMIN-001 Define admin ops product surface

- `Priority`: P2
- `Module`: Admin / Internal ops
- `Objective`: Decide what admin capabilities are public product UI/API versus internal shared-secret operations.
- `Scope`: Produce a feature doc or decision note that defines account audit, class oversight, user support actions, and authorization model.
- `Docs to read first`: `docs/features/api-flow-internal-admin.md`, `docs/features/authentication.md`, `docs/decisions/README.md`.
- `Expected output`: Clear boundary between internal maintenance endpoints and admin-facing product operations.
- `Verification`: Docs review only.

### BE-ADMIN-002 Implement admin ops API after surface approval

- `Priority`: P2
- `Module`: Admin / Internal ops
- `Objective`: Add authenticated Admin-role APIs for the approved admin operations.
- `Scope`: Implement only capabilities approved by `BE-ADMIN-001`; do not expose internal shared-secret maintenance endpoints as product APIs.
- `Docs to read first`: Output from `BE-ADMIN-001`, `docs/features/authentication.md`, `docs/features/error-handling.md`.
- `Expected output`: Admin APIs use normal JWT auth and `Admin` role authorization.
- `Verification`: Add integration tests for admin, teacher, student, and anonymous access.

## P2 Test structure

### BE-TEST-001 Add Application and Domain unit tests

- `Priority`: P2
- `Module`: Tests
- `Objective`: Add real source tests to `test.Application` and `test.Domain`.
- `Scope`: Start with pure validation/mapping/domain lifecycle behavior that does not require a test server.
- `Docs to read first`: `docs/architecture/solution-map.md`, `docs/features/README.md`.
- `Expected output`: `test.Application` and `test.Domain` contain meaningful `.cs` test files and run independently.
- `Verification`: `dotnet test .\test.Application\test.Application.csproj` and `dotnet test .\test.Domain\test.Domain.csproj`.

### BE-TEST-002 Split large integration flows where useful

- `Priority`: P2
- `Module`: Tests
- `Objective`: Reduce regression risk in large multi-feature integration tests by extracting focused scenarios.
- `Scope`: Keep end-to-end happy paths, but add smaller tests for key contracts and failure modes.
- `Docs to read first`: `test.Integration/AGENTS.md`, `docs/features/error-handling.md`, related feature docs.
- `Expected output`: Easier-to-debug tests for assessment, paper exam, notifications, and class content contracts.
- `Verification`: `dotnet test .\test.Integration\test.Integration.csproj`.

### BE-TEST-003 Add dedicated question bank tests

- `Priority`: P2
- `Module`: Question bank
- `Objective`: Cover question bank CRUD/version/tag behavior directly instead of only through assessment setup helpers.
- `Scope`: Add tests for create, list, get, update version append, tag normalization, soft delete, and teacher ownership boundaries.
- `Docs to read first`: `docs/features/question-bank-assessments.md`, `docs/features/error-handling.md`.
- `Expected output`: Question bank regressions are caught without relying on downstream assessment tests.
- `Verification`: `dotnet test .\test.Integration\test.Integration.csproj`.
