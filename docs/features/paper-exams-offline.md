# Paper Exams Offline

## Scope

Template/config management for paper exams, assessment binding, student-side offline scan config delivery, client-submitted OMR payload ingest, grading, review, and finalize flow.

## Design

- `PaperExamTemplate` owns the paper-sheet template identity.
- `PaperExamTemplateVersion` owns the immutable runtime config snapshot once published.
- `PaperExamTemplateAsset` stores geometry/config payloads such as marker layout, circle ROIs, metadata bubble fields, and region windows.
- `AssessmentPaperBinding` links one published template version to one assessment and stores answer-map/review/submission policy JSON.
- `AssessmentScanSubmission`, `AssessmentScanResult`, `AssessmentScanAnswer`, and `AssessmentScanArtifact` store the offline submission and grading audit trail.

## Runtime flow

- Teacher/admin create a paper exam template and draft version.
- Draft version receives JSON assets and metadata field definitions, then is validated and published.
- Teacher binds the published template version to an assessment.
- Student fetches `/offline-scan-config` using JWT auth and receives a runtime snapshot controlled by the backend.
- Student app runs OMR locally and submits raw image plus recognized answers/metadata.
- Backend validates membership, binding/hash/schema compatibility, grades from client payload, stores artifacts, and updates `StudentAssessmentAttempt`.
- Teacher reviews and finalizes when needed.

## Invariants

- Backend is the source of truth for template version, binding version, and config hash.
- Client-side `student_id` is review metadata only; JWT identity remains authoritative.
- Published template versions are immutable.
- Geometry-heavy data stays in JSON/assets rather than exploding into row-level tables.
