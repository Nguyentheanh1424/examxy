# Authentication Backend Gaps For Client Login

## Muc tieu

Frontend `/login` da co trai nghiem moi cho nguoi dung cuoi:

- layout 2 cot va content gioi thieu san pham
- `Ghi nho dang nhap` xu ly hoan toan o client
- social buttons `Google` / `Facebook` dang mo popup thong bao

Tai lieu nay ghi lai nhung phan backend con thieu de frontend co the chuyen tu popup placeholder sang external auth thuc su va giam bot logic mapping dua tren message text.

## Nhung gi BE con thieu

### 1. External auth / social login

Hien tai backend chi co password-based auth:

- `register`
- `login`
- `refresh-token`
- `logout`
- `me`
- password + email flows

Repo khong co dau vet:

- `AddGoogle`
- `AddFacebook`
- external auth challenge/callback endpoints
- account linking flow cho external provider

Khi chua co phan nay, FE chi nen giu social buttons o muc popup thong bao, khong the login that bang Google/Facebook.

### 2. Machine-readable auth error codes cho login states

FE hien dang co nhu cau doi mot so loi login thanh copy than thien cho nguoi dung cuoi. Backend da co status code chung (`401`, `403`, `409`), nhung chua co code rieng de FE map on dinh ma khong phai dua vao message string.

Toi thieu nen co them code rieng cho:

- `invalid_credentials`
- `email_confirmation_required`
- `account_locked`
- `external_auth_not_configured`
- `external_auth_failed`

Neu khong co cac code nay, FE se tiep tuc phai string-match text tieng Anh tra ve tu backend.

### 3. Surface cho FE biet provider nao dang bat

Khi external auth duoc them vao BE, FE can biet:

- provider nao dang enable theo moi truong
- display name / identifier cua provider
- provider nao tam thoi unavailable

Neu khong co surface nay, FE se phai hard-code UI va khong biet khi nao nen an/hien nut social login.

## Huong trien khai de xuat o BE

### External auth API

Mot phuong an don gian, phu hop voi popup flow:

1. `GET /api/auth/external/providers`
   - tra danh sach provider dang enable
   - du lieu toi thieu:
     - `provider`
     - `displayName`
     - `enabled`

2. `POST /api/auth/external/{provider}/start`
   - validate provider da duoc cau hinh
   - tao challenge URL/redirect URL cho popup
   - neu can, luu `state` va anti-forgery data

3. `GET /api/auth/external/{provider}/callback`
   - nhan callback tu provider
   - resolve user hien co theo email/provider key
   - tao account moi neu policy cho phep
   - issue cung `AuthResponseDto` contract nhu login thuong
   - tra ve mot popup bridge page an toan de post ket qua ve `window.opener`

### Account resolution policy

Can khoa ro policy truoc khi code:

- neu provider tra ve email da ton tai trong he thong:
  - link vao account hien co hay tu choi?
- neu provider khong tra ve email:
  - chan login hay tao account o trang thai pending?
- co cho phep mot account lien ket nhieu provider hay khong?
- co can buoc email provider phai verified khong?

Neu khong khoa ro policy nay, implementation se de lech giua FE/BE va rat kho test lai sau.

### Error contract

De FE khong phai parse message text, nen mo rong `ApiErrorResponse.code` cho cac login state quan trong.

Noi can sua kha nang cao:

- `examxy.Infrastructure/Identity/Services/AuthService.cs`
- `examxy.Infrastructure/Identity/Services/IdentityExceptionFactory.cs`
- custom `AppException` neu can
- docs tai `docs/features/authentication.md`

## Nhung gi KHONG can BE thay doi

- `Ghi nho dang nhap` la client-only persistence choice; request login hien tai khong can them field moi
- hero image / logo image cua login page la FE concern
- popup copy hien tai cho Google/Facebook la FE-only placeholder

## Test can bo sung khi BE bat dau lam

- integration test cho `GET /api/auth/external/providers`
- integration test cho provider disabled / missing config
- integration test cho external callback success issue dung `AuthResponseDto`
- integration test cho external callback fail tra machine-readable error code
- integration test cho account linking / duplicate email policy
- manual verify popup flow tu FE voi moi truong dev

## Tai lieu lien quan

- `docs/features/client-authentication.md`
- `docs/features/authentication.md`
- `docs/features/authentication-test-checklist.md`
