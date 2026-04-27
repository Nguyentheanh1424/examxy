# Paper Exams Offline

## Scope

Template/config management for paper exams, assessment binding, student-side offline scan config delivery, client-submitted OMR payload ingest, teacher review/finalize, and artifact download flow.

## Design

- `PaperExamTemplate` owns the paper-sheet template identity.
- `PaperExamTemplateVersion` owns the immutable runtime config snapshot once published.
- `PaperExamTemplateAsset` stores geometry/config payloads such as marker layout, circle ROIs, metadata bubble fields, and region windows.
- `AssessmentPaperBinding` links one published template version to one assessment and stores answer-map/review/submission policy JSON.
- `AssessmentScanSubmission`, `AssessmentScanResult`, `AssessmentScanAnswer`, and `AssessmentScanArtifact` store the offline submission and grading audit trail.

## Runtime flow

- Teacher/admin use `/teacher/paper-exams` to create a template, create blank draft versions, clone a published version back to draft, edit core version fields, upload typed assets, maintain metadata fields, validate, and publish.
- Draft version receives JSON assets and metadata field definitions, then is validated and published.
- Teacher binds the published template version to an assessment from `/classes/{classId}/assessments`.
- `GET /api/classes/{classId}/assessments/{assessmentId}/paper-binding` returns the current teacher-visible binding, including `Draft`; `404` only means no binding exists yet.
- Student fetches `/offline-scan-config` using JWT auth and receives a runtime snapshot controlled by the backend.
- Student app runs OMR locally and submits raw image plus recognized answers/metadata.
- Backend validates membership, binding/hash/schema compatibility, grades from client payload, stores artifacts, and updates `StudentAssessmentAttempt`.
- Scanner submissions are rejected before submission rows are persisted when JSON payloads are malformed, required metadata is missing, question numbers are duplicated, question numbers exceed the published template range, binding versions mismatch, config hashes mismatch, or client schema versions are incompatible.
- Teacher reviews and finalizes when needed from `/classes/{classId}/assessments`, with persisted `TeacherNote`, `ReviewedByTeacherUserId`, and `ReviewedAtUtc`.
- Teacher downloads review artifacts through authenticated API routes instead of direct storage paths.
- Local template assets, scan images, and review artifacts are stored through `PaperExamStorage` options. V1 supports `Provider = Local` with a configured `RootPath`; the default local path is `App_Data/paper-exam`.

## Web surfaces

- `/teacher/paper-exams`
  - template catalog
  - version catalog
  - version editor for core fields, assets, metadata, validate, publish, and clone-to-draft
- `/classes/{classId}/assessments`
  - teacher-only paper-exam panel on the focused assessment
  - binding setup against published template versions
  - submission queue
  - manual review/finalize with artifact download

## Invariants

- Backend is the source of truth for template version, binding version, and config hash.
- Persisted scan submissions must reflect a validated binding/config/schema and a well-formed scanner payload.
- Client-side `student_id` is review metadata only; JWT identity remains authoritative.
- Published template versions are immutable.
- Editing a published template version must happen through clone-to-draft; direct mutation is not supported.
- Geometry-heavy data stays in JSON/assets rather than exploding into row-level tables.
- Scanner capture/upload remains outside the web app; the web app only covers teacher management/review surfaces.
- Paper exam storage provider must be configured and startup-validated before template assets or scan artifacts are persisted.
