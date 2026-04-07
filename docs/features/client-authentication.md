# Client Authentication

## Pham vi

`examxy.client` hien la auth shell chinh cho frontend, bam sat auth contract da co tren backend:

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
2. Client uu tien doc session tu `localStorage`, neu khong co moi doc `sessionStorage`.
3. Neu ca hai storage cung co session, client giu ban trong `localStorage` va xoa ban con lai.
4. Neu khong co session luu tru -> auth state = anonymous.
5. Neu co token pair -> client goi `POST /api/auth/refresh-token`.
6. Refresh thanh cong -> update token pair moi va vao auth state = authenticated.
7. Refresh that bai -> xoa session o ca hai storage va quay ve anonymous.

### Protected request flow

1. Protected request gan bearer access token.
2. Neu API tra `401`, client thu refresh token 1 lan.
3. Neu refresh thanh cong -> retry request 1 lan voi access token moi.
4. Neu refresh that bai -> xoa session o ca `localStorage` va `sessionStorage`.

## UI behavior quan trong

### Login

- Dung `userNameOrEmail` + `password`
- Neu backend tra `403` vi chua confirm email, UI hien notice ro rang va CTA sang resend confirmation
- UI `/login` và toàn bộ các trang Xác thực (Register, Forgot Password...) giờ đây sử dụng chung một kiến trúc Giao diện Hợp nhất (Unified Auth Layout) thông qua Component `<AuthEdgeLayout />`.
- Đặc điểm: Bố cục 2 cột tràn viền (Edge-to-Edge), ảnh Hero bên trái (Desktop) hoặc phía trên (Mobile), sử dụng hiệu ứng Gradient Fade để kết nối với khối Form.
- Toàn bộ trải nghiệm Auth được đặt trong chế độ Dark Theme cố định (màu nền nhạt `#0a1536`) để tạo sự tập trung và sang trọng.
- Social buttons `Google` va `Facebook` hien dang mo popup thong bao trong client, chua goi backend vi BE chua co external auth flow. Các icon social đã được chuyển từ ảnh sang inline SVG để tối ưu.
- Nut `Ghi nho dang nhap` chi anh huong den storage phia client, khong doi request body login.

#### Quy uoc noi dung va layout cho Authentication (Unified)

- Copy tren tất cả các trang Auth phai huong den nguoi dung cuoi, dùng Tiếng Việt 100% chuyên nghiệp và tự nhiên.
- Khong dua mo ta ky thuat, contract backend, hay ngon ngu mang tinh noi bo vao cac khoi noi dung hien thi tren trang.
- Khi cap nhat noi dung, uu tien giu bo cuc can bang, ngan gon, de doc, va tranh copy dai lam vo hierarchy của layout Edge-to-Edge.

#### Asset slot cho `/login`

- Duong dan asset runtime: `examxy.client/public/images/auth/`
- File mo ta slot hien tai: `examxy.client/public/images/auth/README.md`
- Tat ca asset login la optional:
  - neu thieu hero image, UI tu roi ve artwork CSS fallback
  - neu thieu brand/social mark, UI tu roi ve icon/text fallback

#### Nhung gi dang phu thuoc vao BE nhung chua co

- OAuth/external auth cho Google/Facebook chua co o backend
- FE hien van phai string-match mot so login error de doi sang copy than thien; BE chua co machine-readable code rieng cho cac trang thai nhu `email_confirmation_required`
- Chi tiet backlog va huong trien khai BE duoc ghi tai `docs/features/authentication-backend-gaps.md`

### Register

- Submit thanh cong se tao session ngay
- Account page se hien banner nhac user confirm email truoc nhung lan login moi

### Forgot password va resend confirmation

- Luon hien success copy privacy-safe sau `204`
- Khong duoc suy ra email co ton tai hay khong tu UI response

### Confirm email

- Doc `userId` + `token` tu query string
- Link thieu query -> invalid-link state ro rang
- Link hop le -> tu verify va hien success/error state ro rang

### Reset password

- Doc `email` + `token` tu query string
- Link thieu query -> invalid-link state
- Submit thanh cong -> dua user ve login voi flash notice

### Account

- Goi `GET /api/auth/me`
- Hien `userName`, `email`, `roles`, `emailConfirmed`
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

## Config va run local

- Env optional: `VITE_API_BASE_URL`
- Mac dinh: `/api`
- Development voi backend local: de Vite proxy relative `/api` sang `examxy.Server`

## Verify thu cong

1. `npm run dev` trong `examxy.client`
2. Chay backend `examxy.Server`
3. Verify:
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
