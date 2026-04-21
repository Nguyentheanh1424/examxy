# Current State

## Purpose
Snapshot of what is already shipped, what tests cover today, and which constraints are still open.

## Applies when
- You are scoping a change and need to know whether a capability already exists.
- You are deciding whether a behavior is shipped, partial, or still backlog.
- You are updating the delivered state after a feature lands.

## Current behavior / flow
- Delivered backend scope:
  - auth/identity with `Teacher`, `Student`, `Admin`
  - class ownership, membership, invite, roster import, and add-single-student flow
  - class dashboard/content with posts, comments, reactions, mentions, notifications, and schedule items
  - teacher question bank with tags, versions, attachments, and soft delete
  - class assessments with publish lock, attempts, auto-grade objective questions, and teacher results
  - offline paper exam foundation with template/version assets, assessment binding, client-side scan config delivery, submission ingest, grading audit trail, and teacher finalize flow
- Current API shape:
  - class APIs under `/api/classes/*`
  - account-level notifications under `/api/notifications`
  - question bank under `/api/question-bank/questions/*`
  - student dashboard/invite claim under `/api/student/*`
- Current test coverage:
  - integration coverage for authz matrix, reactions, tagging/idempotent notifications, assessment publish/attempt rules, and Swagger/OpenAPI DTO contracts
- Known constraints:
  - no reminder worker for `24h before`
  - notifications are in-app only, with account-level inbox APIs and dashboard deep-link metadata
  - frontend class dashboard still needs fuller UX implementation

## Invariants
- This file tracks shipped behavior and known constraints, not roadmap ideas with no code behind them.
- Capability snapshots here must match the canonical feature docs and current code.
- If a feature is removed, renamed, or materially constrained, this file must be updated in the same change.

## Change checklist
- New shipped feature or removed capability -> update this file and the canonical feature doc
- API route or module boundary shift -> update this file and `docs/architecture/solution-map.md`
- New known constraint or important delivery caveat -> add it here and link the deeper doc if one exists

## Related
- `docs/architecture/solution-map.md`
- `docs/features/README.md`
- `test.Integration/`
