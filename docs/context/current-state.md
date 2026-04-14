# Current State

## Delivery Snapshot

He thong hien tai da chay qua V2 class modules:

- class dashboard/content
- reaction + tagging + in-app notification
- teacher question bank
- class assessments + attempt + auto-grade objective
- route switch class APIs sang `/api/classes/*`

## What Is Implemented

### Foundation

- auth/identity + role policies (`Teacher`, `Student`, `Admin`)
- class ownership/membership/invite/roster import/add single student
- cancel/resend invite

### Class Content

- class dashboard summary endpoint
- feed endpoint (post/comment/attachment/reaction/mention)
- teacher create/update post
- member create/update comment
- teacher hide comment
- reaction set/update/remove (1 reaction/user/target)
- `notifyAll` + `taggedUserIds` for post/comment
- idempotent notification key in DB
- schedule items CRUD (teacher create/update, members read)

### Question Bank

- teacher-global question CRUD
- versioned question snapshots
- tags + attachments metadata (external URL)
- soft delete question (status archived + deleted timestamp)

### Assessments

- create/update draft assessment in class
- publish flow + assessment published notifications
- publish lock rule for content updates
- student attempt start/save/submit
- attempt limit enforcement
- auto-grade objective question types
- teacher results endpoint

## Database State

- `AppDbContext` da map classroom + class content + question bank + assessments.
- migration moi: `20260414085134_V2ClassModules`.
- soft delete fields co tren post/comment/question/assessment.
- attachment model dung metadata + external URL.

## API State

- teacher class foundation APIs da o `/api/classes/*`
- class content APIs da o `/api/classes/{classId}/*`
- question bank APIs da o `/api/question-bank/questions/*`
- assessment APIs da o `/api/classes/{classId}/assessments/*`
- student dashboard/invite claim van o `/api/student/*`

## Test State

- `dotnet build examxy.slnx`: pass
- `dotnet test test.Integration/test.Integration.csproj`: pass
- integration tests da cover:
  - authz matrix owner/member/non-member
  - reaction set/update/remove uniqueness
  - tagging + notifyAll idempotent notification behavior
  - assessment publish lock + attempt limit + auto-grade
  - swagger/openapi route + DTO contract assertions cho APIs moi

## Known V1/V2 Constraints

- chua co worker scheduler cho reminder `24h before` (backlog).
- notification hien tai la in-app persistence model (khong push worker).
- FE hien tai can implement full class dashboard UX theo docs flow moi.
