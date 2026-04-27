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
  - class dashboard/content with posts, comments, reactions, mentions, notifications, schedule items, and configurable schedule reminders for assessment/deadline items
  - teacher question bank with tags, versions, attachments, and soft delete
  - class assessments with publish lock, timed attempt expiry, attempts, auto-grade objective questions, and teacher results
  - offline paper exams with configured local storage, template/version assets, version clone-to-draft, assessment binding, client-side scan config delivery, submission ingest, teacher review audit, secure artifact download, and finalize flow
- Current API shape:
  - class APIs under `/api/classes/*`
  - account-level notifications under `/api/notifications`
  - question bank under `/api/question-bank/questions/*`
  - student dashboard/invite claim under `/api/student/*`
- Current test coverage:
  - integration coverage for authz matrix, reactions, tagging/idempotent notifications, reminder processing/idempotency, assessment publish/attempt rules, and Swagger/OpenAPI DTO contracts
- Known constraints:
  - notifications are in-app only, with account-level inbox APIs, SignalR realtime push, and dashboard deep-link metadata
  - reminder worker currently covers only `Assessment` and `Deadline` schedule items with configured lead times; no email/push channel and no revoke/update after a reminder has already been dispatched
  - frontend class dashboard consumes class/user realtime events by refreshing canonical REST data after server push
  - teacher/student pilot UI now covers notifications inbox, class assessments, teacher question bank, full teacher paper-exam template workspace, and teacher-side paper submission review on class assessments, but admin ops surface is still minimal
  - paper-exam scanning/upload still belongs to the external student scanner client; web only handles teacher template management, binding, review, artifact download, and finalize

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
