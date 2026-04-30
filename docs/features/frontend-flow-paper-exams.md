# Frontend Flow - Paper Exams

## Purpose

Define planned UI pattern migration for paper exam templates and versions.

This document is planning guidance. Runtime UI migration has not shipped yet.

## Source files

| Type | Path |
|---|---|
| Real route | `/teacher/paper-exams` |
| Real page | `examxy.client/src/features/paper-exams/pages/paper-exam-templates-page.tsx` |
| Real API | `examxy.client/src/features/paper-exams/lib/paper-exam-api.ts` |
| Real types | `examxy.client/src/types/paper-exam.ts` |
| Real tests | `examxy.client/src/features/paper-exams/pages/paper-exam-templates-page.test.tsx` |
| tmp reference | `examxy.client/src/tmp/teacher/PaperExamsPage.tsx` |

## Current behavior to preserve

- Existing template and version API workflow.
- Template creation.
- Version creation and update.
- Asset upload behavior.
- Metadata field upsert behavior.
- Validate workflow.
- Publish workflow.
- Clone-to-draft workflow.
- Query-string template/version selection behavior.
- Route `/teacher/paper-exams` protected for `Teacher` and `Admin`.

## Candidate tmp patterns

| Pattern | Decision | Data support | Notes |
|---|---|---|---|
| Catalog layout | Candidate | Existing template list API | Low risk if selection behavior remains unchanged. |
| Detail/editor organization | Candidate | Existing selected template/version state | Preserve current state machine and API calls. |
| Preview panel | Candidate | Existing template/version data only | Do not fake geometry or answer-sheet data not present in API. |
| Validation status affordances | Candidate | Existing validation result | Preserve semantics of valid vs invalid. |
| Version timeline/list polish | Candidate | Existing version list | Published versions remain immutable. |
| Export/print/download controls | Backlog | No current client API for template export | Do not add mock controls. |

## High-risk areas

- Version selection and query-string synchronization.
- Draft vs published version state.
- Validate/publish ordering.
- Clone-to-draft behavior.
- Asset upload and metadata field persistence.

## Acceptance criteria

- No API payload changes unless separately documented.
- Existing paper exam tests remain behavior-valid.
- Published template versions remain immutable in the UI.
- No fake preview data is introduced.
- GitNexus impact is rerun before editing `PaperExamTemplatesPage`.

## Related

- `docs/features/paper-exams-offline.md`
- `docs/features/question-bank-assessments.md`
- `docs/features/figma-ui-migration-phase-1.md`
