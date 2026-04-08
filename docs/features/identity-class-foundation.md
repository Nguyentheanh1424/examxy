# Identity + Class Foundation

## Summary

V1 hien tai da dat nen tang role-based cho 3 actor co dinh:

- `Teacher`
- `Student`
- `Admin`

Muc tieu cua foundation nay la de auth, dashboard routing, class ownership, roster import, invite claim, va internal admin provisioning co mot model nhat quan de mo rong service sau nay.

## Actor model va quy tac provision

- Moi account chi co 1 primary role trong pham vi v1.
- `Teacher`
  - la role mac dinh cua public register flow `POST /api/auth/register`
  - co the tao va quan ly class do minh so huu
- `Student`
  - co the duoc tao qua `POST /api/auth/register/student`
  - hoac duoc teacher tao/invite qua roster import
  - sau khi login vao dashboard student va claim invite bang code
- `Admin`
  - khong di qua public signup
  - duoc cap qua `POST /internal/admin-users`
  - endpoint nay bat buoc secret header tu config

Auth response va current-user response deu tra `primaryRole` de client redirect/guard ro rang.

## Data model hien tai

### Shared identity

- `ApplicationUser`
  - `FullName`
  - `CreatedAtUtc`
  - `LastActivatedAtUtc`

### Profiles

- `TeacherProfile`
  - 1-1 voi `ApplicationUser`
- `StudentProfile`
  - 1-1 voi `ApplicationUser`
  - `StudentCode` nullable va unique khi co gia tri
  - `OnboardingState`
    - `Invited`
    - `Active`
    - `Suspended`

### Classroom foundation

- `Classroom`
  - `Name`
  - `Code`
  - `OwnerTeacherUserId`
  - `Status`
  - `CreatedAtUtc`
- `ClassMembership`
  - `ClassroomId`
  - `StudentUserId`
  - `Status`
  - `JoinedAtUtc`
- `ClassInvite`
  - `ClassroomId`
  - `Email`
  - `StudentUserId` nullable
  - `InviteCodeHash`
  - `Status`
  - `SentAtUtc`
  - `UsedAtUtc`
  - `UsedByUserId`
  - `ExpiresAtUtc`
- `StudentImportBatch`
  - luu lan import roster cua teacher
- `StudentImportItem`
  - luu ket qua tung row, nhu `CreatedAccount`, `SentInvite`, `RejectedWrongRole`

## API surface chinh

### Identity va auth

- `POST /api/auth/register`
- `POST /api/auth/register/student`
- `POST /api/auth/login`
- `POST /api/auth/refresh-token`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Teacher foundation

- `GET /api/teacher/classes`
- `POST /api/teacher/classes`
- `GET /api/teacher/classes/{classId}`
- `PUT /api/teacher/classes/{classId}`
- `DELETE /api/teacher/classes/{classId}`
- `POST /api/teacher/classes/{classId}/roster-imports`

### Student foundation

- `GET /api/student/dashboard`
- `POST /api/student/invites/claim`

### Internal admin provisioning

- `POST /internal/admin-users`
- `GET /internal/admin/identity/audit`
- `POST /internal/admin/identity/repair-primary-roles`
- `POST /internal/admin/identity/backfill-profiles`
- `POST /internal/admin/identity/migrate-legacy-users`

## Behavioral contract hien tai

### Teacher

- teacher chi duoc CRUD class do minh so huu
- teacher chi duoc import roster vao class cua minh
- neu import email chua co account:
  - tao invited student account
  - tao student profile
  - tao invite vao class
  - gui activation/set-password email
- neu import email da la student:
  - khong tao account moi
  - tao invite vao class va gui email
- neu import email da ton tai nhung khong phai student:
  - reject row va ghi audit trong import batch

### Student

- student self-signup tao account role `Student`
- student moi co the chua thuoc class nao
- dashboard student phai hoat dong voi empty state
- claim invite chi thanh cong neu email dang login trung email da duoc invite
- invite chi dung duoc 1 lan
- claim thanh cong tao membership `Active` va audit `UsedByUserId`

### Admin

- admin account dung chung identity store nhu cac role khac
- admin provisioning hien tai la internal-only
- client co route `/admin/dashboard` de redirect theo role ro rang, nhung admin UI van chi o muc placeholder

## Client routing va UX

- `/` redirect theo `primaryRole`
- `Teacher` -> `/teacher/dashboard`
- `Student` -> `/student/dashboard`
- `Admin` -> `/admin/dashboard`
- `/register` la teacher self-signup
- `/student/register` la student self-signup
- `/account` van ton tai nhu trang account chung, nhung khong con la landing page mac dinh

## Trang thai verify hien tai

- `dotnet build examxy.slnx` xanh
- `dotnet test test.Integration/test.Integration.csproj` xanh
- `npm run test:run` trong `examxy.client` xanh
- `npm run build` trong `examxy.client` xanh

Integration tests da cover:

- teacher/student/admin role foundation
- migration/backfill role legacy
- student onboarding
- roster import
- invite claim
- teacher authorization
- internal admin provisioning

## Gioi han v1

- single-tenant
- one primary role per account
- `Classroom` la entity nghiep vu duy nhat, chua tach `Course`/`ClassSection`
- admin UI moi o muc placeholder route
- `Ghi nho dang nhap` van la client-only persistence toggle

## Backlog sau V1

- teacher management flows sau import:
  - cap nhat roster
  - disable/remove student khoi class
  - resend invite va xem lich su chi tiet hon
- student class management chi tiet:
  - deep-link invite UX day du hon
  - join multiple classes voi navigation tot hon
  - self-service profile completion
- admin hardening:
  - audit trail cho internal provisioning
  - secret rotation/operational controls
  - admin management UI neu can
- role/model evolution:
  - can nhac multi-role neu nghiep vu thay doi
  - can nhac multi-tenant neu he thong vuot qua mot to chuc
