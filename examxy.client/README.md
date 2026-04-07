# examxy.client

React 19 + Vite frontend cho auth shell cua Examxy. Client hien tai chi cover authentication flows da co tren backend, chua bao gom dashboard nghiep vu hay admin UI.

## Pham vi hien tai

- login bang `userNameOrEmail` + `password`
- register va bootstrap session sau khi tao tai khoan
- luu session vao `localStorage` hoac `sessionStorage`
- refresh token khi protected request gap `401`
- current user workspace tai `/account`
- logout
- change password
- forgot/reset password
- confirm email
- resend email confirmation

## Scripts

```powershell
npm install
npm run dev
npm run lint
npm run test:run
npm run build
```

## Route map

- `/` -> redirect theo auth state
- `/login`
- `/register`
- `/forgot-password`
- `/resend-email-confirmation`
- `/confirm-email?userId=...&token=...`
- `/reset-password?email=...&token=...`
- `/account`
- `*` -> not found page

## Cau truc chinh

- `src/app/router.tsx`: route map va route guards
- `src/app/app-layout.tsx`: app shell cho auth pages va account workspace
- `src/features/auth/auth-context.tsx`: bootstrap session, persistence, refresh flow
- `src/features/auth/auth-storage.ts`: doc/ghi/xoa session trong browser storage
- `src/features/auth/lib/auth-api.ts`: typed auth API calls
- `src/lib/http/api-client.ts`: API client chung, gan bearer token va retry sau refresh
- `src/components/ui/*`: shared primitives cho auth shell
- `src/styles/tokens.css`: design tokens dang duoc client consume

## Asset dang duoc su dung

- `public/favicon.svg`
- `public/images/auth/login-hero-main.webp`

Nhung asset scaffold mac dinh cua Vite da duoc loai bo de tranh de lai code khong con duoc tham chieu.

## Config

- `VITE_API_BASE_URL`: optional override cho API base URL
- mac dinh client goi relative `/api`

## Verify nhanh

```powershell
npm run lint
npm run test:run
npm run build
```

Tai lieu chi tiet nam o `../docs/features/client-authentication.md`.
