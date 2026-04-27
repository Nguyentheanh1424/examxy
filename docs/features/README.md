# Features Docs Index

## Purpose

Routing index for the canonical feature docs and supporting flow docs in `docs/features/`.

## Applies when

- You need to choose the correct feature doc before editing code.
- You are deciding whether a concept belongs in a canonical feature doc or a supporting flow doc.
- You are adding or moving a feature source-of-truth document.

## Current behavior / flow

- Foundation docs:
  - `authentication.md`: backend auth/identity, tokens, email auth flow, auth endpoints
  - `client-authentication.md`: frontend auth/session/routes
  - `identity-class-foundation.md`: role model, class ownership/membership/invite/roster foundation
  - `notifications.md`: account-level notification inbox, filters, read state, and deep-link metadata
  - `realtime.md`: SignalR hub contract, subscription rules, event constants, and payload envelope
  - `error-handling.md`: shared API error contract
- Classroom/content docs:
  - `class-dashboard-content.md`: backend class content model and contracts
  - `frontend-flow-class-dashboard.md`: frontend dashboard UX/state/action mapping
  - `api-flow-class-content.md`: multi-step content sequence details
- Question bank and assessment docs:
  - `question-bank-assessments.md`: canonical backend behavior
  - `api-flow-assessment.md`: multi-step assessment flow details
  - `paper-exams-offline.md`: offline paper exam template/config, binding, scan ingest, and review flow
- Cross-module API sequence docs:
  - `api-flow-authentication.md`
  - `api-flow-classrooms.md`
  - `api-flow-internal-admin.md`

## Invariants

- Canonical feature docs own behavior and invariants.
- `api-flow-*` docs support canonical docs with multi-step sequences; they do not replace them.
- Avoid copying the same behavior into both backend and frontend docs unless each side has distinct responsibilities.

## Change checklist

- New canonical feature doc -> add it here with a one-line ownership description
- New supporting flow doc -> add it under the owning canonical feature area
- Renamed or merged feature docs -> update this index and any `AGENTS.md` that route to them

## Related

- `docs/architecture/solution-map.md`
- `docs/context/current-state.md`
- `docs/README.md`
