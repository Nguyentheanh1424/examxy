# Client Authentication

## Pham vi

`examxy.client` hien la auth shell chinh cua frontend, bam sat auth contract da co tren backend:

- register
- login
- refresh token
- logout
- current user
- change password
- forgot/reset password
- confirm email
- resend email confirmation

Client chua bao gom dashboard nghiep vu, exam management, hay admin UI.

## Route map

- `/`
  - redirect sang `/account` neu da co session hop le
  - redirect sang `/login` neu chua co session
- `/login`
- `/register`
- `/forgot-password`
- `/resend-email-confirmation`
- `/confirm-email?userId=...&token=...`
- `/reset-password?email=...&token=...`
- `/account`
- `*`
  - render not found page

## Cau truc thuc te trong client

- `src/main.tsx`
  - bootstrap React app va mount `App`
- `src/App.tsx`
  - render `RouterProvider`
- `src/app/router.tsx`
  - route map, `AuthProvider`, `GuestOnlyRoute`, `ProtectedRoute`
- `src/app/app-layout.tsx`
  - app shell cho auth pages va account workspace
- `src/features/auth/auth-context.tsx`
  - bootstrap session, login/register/logout, refresh coordination
- `src/features/auth/auth-storage.ts`
  - layer doc/ghi/xoa session trong `localStorage` va `sessionStorage`
- `src/features/auth/lib/auth-api.ts`
  - typed calls den auth endpoints
- `src/lib/http/api-client.ts`
  - API client chung, attach bearer token, refresh-once-on-401, map API error
- `src/components/ui/*`
  - shared primitives dang duoc auth shell consume

## Session model

Client dung `AuthSession` gom:

- `userId`
- `userName`
- `email`
- `roles`
- `accessToken`
- `refreshToken`
- `expiresAtUtc`

Session duoc luu voi key `examxy.auth.session`:

- `localStorage` khi user bat `Ghi nho dang nhap`
- `sessionStorage` khi user tat `Ghi nho dang nhap`

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
- Toan bo auth pages dung chung `<AuthEdgeLayout />` va hero image tu `public/images/auth/login-hero-main.webp`

### Register

- Submit thanh cong se tao session ngay
- Sau khi vao `/account`, user chua confirm email se thay warning notice va CTA resend confirmation

### Forgot password va resend confirmation

- Luon hien success copy privacy-safe sau `204`
- UI khong cho phep suy ra email co ton tai hay khong

### Confirm email

- Doc `userId` + `token` tu query string
- Link thieu query se vao invalid-link state
- Link hop le se auto submit verify va hien success/error state ro rang

### Reset password

- Doc `email` + `token` tu query string
- Link thieu query se vao invalid-link state
- Submit thanh cong dua user ve `/login` kem flash notice

### Account

- Goi `GET /api/auth/me`
- Hien `userName`, `email`, `roles`, `emailConfirmed`
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
   - register gui mail confirm
   - login truoc confirm hien warning + CTA resend
   - social buttons mo popup thong bao, khong dieu huong sang route rieng
   - `Ghi nho dang nhap` bat -> session vao `localStorage`, tat -> session vao `sessionStorage`
   - confirm email link hoat dong
   - login thanh cong vao `/account`
   - logout clear session
   - change password sign-out local sau khi submit thanh cong
   - forgot password hien success copy privacy-safe
   - reset password bang link that tu email

## Test automation hien co

- `src/features/auth/auth-context.test.tsx`
- `src/lib/http/api-client.test.ts`
- `src/lib/http/api-error.test.ts`
- `src/features/auth/components/protected-route.test.tsx`
- `src/features/auth/pages/auth-pages.test.tsx`
- `src/features/auth/pages/login-page.test.tsx`
