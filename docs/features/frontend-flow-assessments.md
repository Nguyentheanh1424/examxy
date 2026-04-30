# Frontend Flow - Assessments

## Purpose

Define planned UI pattern migration for the class assessment workspace.

This document is planning guidance. Runtime UI migration has not shipped yet.

## Source files

| Type | Path |
|---|---|
| Real route | `/classes/:classId/assessments` |
| Real page | `examxy.client/src/features/assessments/pages/class-assessments-page.tsx` |
| Real API | `examxy.client/src/features/assessments/lib/assessment-api.ts`, `examxy.client/src/features/paper-exams/lib/paper-exam-api.ts` |
| Real types | `examxy.client/src/types/assessment.ts`, `examxy.client/src/types/paper-exam.ts` |
| Real tests | `examxy.client/src/features/assessments/pages/class-assessments-page.test.tsx` |
| tmp reference | `examxy.client/src/tmp/class/ClassAssessments.tsx` |

## Current behavior to preserve

- Assessment status behavior for `Draft`, `Published`, and `Closed`.
- Teacher create and publish flows.
- Student attempt flows.
- Teacher results flow.
- Paper-exam binding setup and activation.
- Offline submission queue, review, finalize, and artifact download behavior.
- Teacher/student permission differences.
- Route `/classes/:classId/assessments` protected for `Teacher` and `Student`.

## Candidate tmp patterns

| Pattern | Decision | Data support | Notes |
|---|---|---|---|
| Status tabs | Conditional | Existing status model | Must match real statuses; no synthetic states. |
| Detail panel | Candidate | Existing selected assessment state | No route change unless existing query behavior supports it. |
| Assessment cards/list polish | Candidate | Existing assessment list | Preserve teacher/student action visibility. |
| Paper binding UI polish | Candidate | Existing binding behavior | Preserve API calls and validation notices. |
| Submission review organization | Candidate | Existing offline submission data | Do not invent scanner data. |
| Empty/loading states | Candidate | Supported | No mock records. |

## Acceptance criteria

- Publish, results, binding, review, and student attempt tests remain valid.
- Status filters never hide required teacher/student actions permanently.
- Permission-based UI remains intact.
- No new paper-exam behavior is implied without API support.
- GitNexus impact is rerun before editing `ClassAssessmentsPage`.

## Related

- `docs/features/question-bank-assessments.md`
- `docs/features/api-flow-assessment.md`
- `docs/features/paper-exams-offline.md`
- `docs/features/figma-ui-migration-phase-1.md`
