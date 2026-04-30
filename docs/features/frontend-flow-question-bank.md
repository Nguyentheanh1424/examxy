# Frontend Flow - Question Bank

## Purpose

Describe the real Question Bank frontend flow and the UI patterns selected from `examxy.client/src/tmp`.

This document is the source of truth for Batch 1 of the Figma UI pattern migration. `src/tmp` is reference UI only and must not be imported into runtime code.

## Source files

| Type | Path |
|---|---|
| Real route | `/teacher/question-bank` |
| Real page | `examxy.client/src/features/question-bank/pages/question-bank-page.tsx` |
| Real API | `examxy.client/src/features/question-bank/lib/question-bank-api.ts` |
| Real types | `examxy.client/src/types/question-bank.ts` |
| Real tests | No dedicated page test found before Batch 1 |
| tmp reference | `examxy.client/src/tmp/teacher/QuestionBankPage.tsx` |
| Router | `examxy.client/src/app/router.tsx` |

## Current behavior to preserve

- Route `/teacher/question-bank` stays protected for `Teacher`.
- Page loads real questions using `getQuestionsRequest()`.
- Create flow uses `createQuestionRequest(toCreateRequest(draft))`.
- Update flow uses `updateQuestionRequest(editId, toUpdateRequest(question, editDraft))`.
- Delete/archive flow uses `deleteQuestionRequest(questionId)`.
- API errors continue to render through `getErrorMessage`.
- Draft-to-payload builders preserve `stemPlainText`, `stemRichText`, `questionType`, `explanationRichText`, `difficulty`, `estimatedSeconds`, `contentJson`, `answerKeyJson`, `tags`, and `attachments`.
- Existing loading, empty, success, and error behavior may be replaced only with behavior-equivalent richer UI.
- No server-side filtering, archive restore, import, duplicate, or bulk action is added unless the API contract is extended in a separate backend/API doc.

## Candidate UI patterns from tmp

| Pattern | Decision | Support | Notes |
|---|---|---|---|
| `Active / Archived / All` tabs | Conditional | `Question.status` exists | Use loaded data only. Do not add restore semantics unless API supports it. |
| Search input | Migrate | `stemPlainText`, current version fields, `tags`, `code` exist | Local-only search is acceptable; do not imply server search. |
| Filter tags | Migrate if simple | `Question.tags` exists | Use tags from loaded questions. Do not add unsupported subject/grade filters. |
| Type filter | Conditional | Current version has `questionType` | Use current version data if helper logic is clear and tested. |
| Difficulty filter | Conditional | Current version has `difficulty` | Use current version data if visible in existing payload. |
| Detail/preview panel | Migrate | Selected question and current version data exist | No route change; panel must tolerate malformed JSON fields. |
| Editor layout polish | Migrate | Existing create/edit behavior exists | Preserve payload builders and API calls. |
| Rich empty state | Migrate | No API change needed | CTA must open existing create flow. |
| Loading skeleton | Migrate | No API change needed | Must not hide error state. |
| Attachments display | Conditional | Version attachments exist | Display metadata only; do not add upload behavior unless API exists. |
| Duplicate/copy action | Backlog | No current API behavior | Document as backlog, not runtime action. |
| Bulk actions | Backlog | No current API behavior | Do not implement in Batch 1. |

## Data/API support matrix

| UI need | Existing field/API | Supported now? | Decision |
|---|---|---|---|
| List questions | `GET /api/question-bank/questions` via `getQuestionsRequest()` | Yes | Preserve. |
| Create question | `POST /api/question-bank/questions` via `createQuestionRequest()` | Yes | Preserve payload builder. |
| Update question | `PUT /api/question-bank/questions/{questionId}` via `updateQuestionRequest()` | Yes | Preserve append-version behavior. |
| Delete/archive question | `DELETE /api/question-bank/questions/{questionId}` via `deleteQuestionRequest()` | Yes | Treat UI as archive/delete according to current backend semantics; do not add restore. |
| Display status | `Question.status` | Yes | May drive status tab and badge. |
| Search by stem | `QuestionVersion.stemPlainText` | Yes, local only | Use current version helper. |
| Search by tags | `Question.tags` | Yes, local only | Use loaded data. |
| Filter by status | `Question.status` | Yes, local only | Tabs can be local. |
| Filter by subject | No dedicated field | No | Backlog/API gap. |
| Filter by grade | No dedicated field | No | Backlog/API gap. |
| Filter by difficulty | `QuestionVersion.difficulty` | Yes, local only | Conditional if UI remains simple. |
| Filter by type | `QuestionVersion.questionType` | Yes, local only | Conditional if UI remains simple. |
| Preview selected question | `Question.versions`, `currentVersionNumber`, rich/plain text, JSON payloads | Yes | Must handle missing/current version mismatch gracefully. |
| Preview choices/answer key | `contentJson`, `answerKeyJson` | Partially | Parse defensively; invalid JSON should not crash the page. |
| Attachments preview | `QuestionVersion.attachments` | Metadata only | No upload/runtime file behavior in Batch 1. |
| Restore archived question | No dedicated API in current client | No | Backlog/API gap. |
| Bulk action | No dedicated API in current client | No | Backlog/API gap. |

## UX flow

1. User opens `/teacher/question-bank`.
2. `ProtectedRoute` verifies the user has the `Teacher` role.
3. Page loads real questions from the current question-bank API.
4. User can search/filter only against fields already loaded from the API.
5. User can select a question to see preview/detail without route changes.
6. User can create/edit using the existing draft state and payload builders.
7. User can delete/archive using the existing delete API behavior.
8. Errors remain visible and actionable; loading and empty states remain distinct.

## Explicit non-goals

- No runtime import from `src/tmp`.
- No mock question records.
- No `components/eds` or prototype `AppShell`.
- No route changes.
- No server-side filtering unless the API already supports it.
- No subject/grade filters until the API/types expose those concepts.
- No restore, duplicate, import, or bulk actions in Batch 1.
- No broad copy rewrite.

## Tests to preserve or add

- Add a page test file if Batch 1 changes behavior-facing UI.
- Preserve coverage for list loading through `getQuestionsRequest()`.
- Preserve create payload behavior through `createQuestionRequest()`.
- Preserve update payload behavior through `updateQuestionRequest()`.
- Preserve delete/archive behavior through `deleteQuestionRequest()`.
- Add tests for local status tabs if implemented.
- Add tests for local search/tag filters if implemented.
- Add tests for selecting a question and rendering the preview/detail panel if implemented.
- Add a defensive JSON preview test if `contentJson` or `answerKeyJson` is parsed for UI.

## Acceptance criteria

- Existing CRUD behavior still works.
- UI uses real API data only.
- Filters/tabs never permanently hide expected records and are resettable.
- Empty, loading, and error states are readable and behavior-equivalent.
- Vietnamese text is encoding-safe.
- No unsupported API behavior is implied by visible controls.
- GitNexus impact is rerun before editing `QuestionBankPage`.
- `npm run lint`, `npm run test:run`, and `npm run build` pass for the implementation batch.

## Related

- `docs/features/question-bank-assessments.md`
- `docs/features/figma-ui-migration-phase-1.md`
- `docs/features/tmp-to-real-ui-mapping.md`
