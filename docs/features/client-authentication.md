# Client Authentication

## Pham vi

`examxy.client` hien la app shell cho auth va role-based entry flows cua 3 actor:

- teacher
- student
- admin

Client dang cover:

- teacher register
- student register
- login
- refresh token
- logout
- current user
- change password
- forgot/reset password
- flow diagrams trong `docs/features/api-flow-authentication.md` va `docs/features/api-flow-classrooms.md`
- confirm email
- resend email confirmation
- role-based redirect sau login
- teacher/student/admin dashboard scaffolds
- teacher class create/detail/import pages
- student invite claim tu dashboard

Client chua co admin management UI day du, exam management, hay operational screens sau v1 foundation.

## Route map

- `/`
  - redirect sang dashboard theo `primaryRole` neu da co session hop le
  - redirect sang `/login` neu chua co session
- `/login`
- `/register`
  - teacher self-signup
- `/student/register`
  - student self-signup
- `/forgot-password`
- `/resend-email-confirmation`
- `/confirm-email?userId=...&token=...`
- `/reset-password?email=...&token=...`
- `/teacher/dashboard`
- `/teacher/classes/new`
- `/teacher/classes/:classId`
- `/teacher/classes/:classId/import`
- `/student/dashboard`
- `/admin/dashboard`
- `/account`
  - trang account chung cho authenticated user
  - khong con la landing page mac dinh sau login
- `*`
  - render not found page

## Cau truc thuc te trong client

- `src/app/router.tsx`
  - route map, `AuthProvider`, `GuestOnlyRoute`, `ProtectedRoute`
- `src/app/app-layout.tsx`
  - app shell cho auth pages va role-based workspaces
- `src/features/auth/auth-context.tsx`
  - bootstrap session, login/register/registerStudent/logout, refresh coordination
- `src/features/auth/lib/auth-api.ts`
  - typed calls den auth endpoints
- `src/features/auth/lib/auth-role-routing.ts`
  - mapping `primaryRole` -> default route
- `src/features/classrooms/lib/class-api.ts`
  - teacher class APIs, roster import, student dashboard, invite claim
- `src/features/teacher/pages/*`
  - dashboard, class create/detail/import scaffolds
- `src/features/student/pages/*`
  - student register va dashboard
- `src/features/admin/pages/*`
  - admin dashboard placeholder
- `src/lib/http/api-client.ts`
  - API client chung, attach bearer token, refresh-once-on-401, map API error

## Session model

Client dung `AuthSession` gom:

- `userId`
- `userName`
- `email`
- `roles`
- `primaryRole`
- `accessToken`
- `refreshToken`
- `expiresAtUtc`

Session duoc luu voi key `examxy.auth.session`:

- `localStorage` khi user bat `Ghi nho dang nhap`
- `sessionStorage` khi user tat `Ghi nho dang nhap`

### Luu y ve `Ghi nho dang nhap`

`Ghi nho dang nhap` hien tai la mot lua chon persistence o client, khong phai session policy duoc backend hieu rieng:

- request `POST /api/auth/login` khong gui them field `rememberMe`
- backend van issue cung mot `AuthResponseDto` va cung refresh-token policy cho ca 2 truong hop
- khac biet hien tai chi nam o cho client luu token vao `localStorage` hay `sessionStorage`

He qua thuc te:

- bat checkbox -> user co the duoc bootstrap lai session sau khi dong/mo lai browser, mien la refresh token van con hop le
- tat checkbox -> token khong duoc giu qua browser session, nhung backend khong biet day la non-persistent login

Neu sau nay can bien `Ghi nho dang nhap` thanh behavior full-stack, can mo rong contract login va refresh-token policy o backend. Xem them `docs/features/authentication-backend-gaps.md`.

### Bootstrap flow

1. App khoi dong.
2. Client doc session luu tru qua `loadAuthSession()`.
3. Neu khong co session, auth state chuyen sang `anonymous`.
4. Neu co token pair, client goi `POST /api/auth/refresh-token`.
5. Refresh thanh cong thi session duoc cap nhat va auth state chuyen sang `authenticated`.
6. Refresh that bai thi xoa session o browser storage va quay ve `anonymous`.

### Protected request flow

1. Protected request gan bearer access token hien tai.
2. Neu API tra `401`, client thu refresh token 1 lan.
3. Neu refresh thanh cong, request duoc retry 1 lan voi access token moi.
4. Neu refresh that bai, client xoa session local va user tro ve anonymous state.

## Hanh vi UI quan trong

### Login

- Dung `userNameOrEmail` + `password`
- Co tuy chon `Ghi nho dang nhap`
- Neu backend tra `403` vi chua confirm email, UI hien `Notice` warning va CTA sang resend confirmation
- Social buttons `Google` va `Facebook` hien tai chi mo popup thong bao trong client, chua goi backend
- Neu login thanh cong:
  - `Teacher` -> `/teacher/dashboard`
  - `Student` -> `/student/dashboard`
  - `Admin` -> `/admin/dashboard`

### Teacher register

- Submit thanh cong se tao session ngay voi `primaryRole = Teacher`
- UI dieu huong sang dashboard teacher thay vi `/account`

### Student register

- Route rieng: `/student/register`
- Submit thanh cong se tao session ngay voi `primaryRole = Student`
- Student vao dashboard rieng, co empty state neu chua join class nao

### Forgot password va resend confirmation

- Luon hien success copy privacy-safe sau `204`
- UI khong cho phep suy ra email co ton tai hay khong

### Confirm email

- Doc `userId` + `token` tu query string
- Link thieu query se vao invalid-link state
- Link hop le se auto submit verify va hien success/error state ro rang
- Sau khi confirm xong, CTA tiep tuc dung default route theo role neu da co session

### Reset password

- Doc `email` + `token` tu query string
- Link thieu query se vao invalid-link state
- Submit thanh cong dua user ve `/login` kem flash notice
- Imported invited student sau khi dat mat khau xong se duoc backend mark onboarding active

### Teacher dashboard va class pages

- Teacher dashboard hien danh sach class cua minh
- Teacher co page tao class
- Teacher co page xem chi tiet class
- Teacher co page import roster vao class
- Detail page hien danh sach student, membership, invite, va import results o muc scaffold v1

### Student dashboard

- Hien thong tin profile/onboarding
- Hien danh sach class da join
- Neu chua co class, hien empty state va CTA claim invite
- Form claim invite goi `POST /api/student/invites/claim`
- UI phan biet duoc cac state nhu success, invalid, expired, already used

### Admin dashboard

- Hien tai la placeholder route de role-based redirect ro rang
- Chua co public admin management UI cho provisioning

### Account

- Goi `GET /api/auth/me`
- Hien `userName`, `email`, `roles`, `primaryRole`, `emailConfirmed`
- Cho phep logout
- Cho phep change password
- Change password thanh cong se sign-out local ngay vi backend revoke refresh tokens

## API error mapping

Client parse `ApiErrorResponse` chung cua backend:

```json
{
  "statusCode": 400,
  "code": "validation_error",
  "message": "One or more validation errors occurred.",
  "traceId": "0HN...",
  "errors": {
    "Password": [
      "The Password field is required."
    ]
  }
}
```

Rule frontend:

- `message` -> top-level notice
- `errors[field]` -> inline field error
- PascalCase field names tu backend duoc normalize thanh camelCase o client

## Asset dang duoc su dung

- `public/favicon.svg`
- `public/images/auth/login-hero-main.webp`

Default assets scaffold cua Vite khong con duoc tham chieu da duoc loai bo khoi client source.

## Config va run local

- env optional: `VITE_API_BASE_URL`
- mac dinh: `/api`
- development voi backend local: de Vite proxy relative `/api` sang `examxy.Server`

## Verify thu cong

1. Chay `npm install` trong `examxy.client`
2. Chay `npm run dev`
3. Chay backend `examxy.Server`
4. Verify:
   - teacher register gui mail confirm va vao dashboard teacher
   - student register vao dashboard student
   - login truoc confirm hien warning + CTA resend
   - social buttons mo popup thong bao, khong dieu huong sang route rieng
   - `Ghi nho dang nhap` bat -> session vao `localStorage`, tat -> session vao `sessionStorage`
   - confirm email link hoat dong
   - teacher login vao `/teacher/dashboard`
   - student login vao `/student/dashboard`
   - admin login vao `/admin/dashboard`
   - teacher tao class va import roster thanh cong
   - student claim invite thanh cong bang dung email da duoc invite
   - logout clear session
   - change password sign-out local sau khi submit thanh cong

## Test automation hien co

- `src/features/auth/auth-context.test.tsx`
- `src/features/auth/lib/auth-role-routing.test.ts`
- `src/lib/http/api-client.test.ts`
- `src/lib/http/api-error.test.ts`
- `src/features/auth/components/protected-route.test.tsx`
- `src/features/auth/pages/auth-pages.test.tsx`
- `src/features/auth/pages/login-page.test.tsx`
