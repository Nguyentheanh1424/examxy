# Authentication

## Pham vi hien tai

Auth/Identity hien tai bao gom:

- dang ky
- dang nhap
- refresh token
- dang xuat
- lay current user
- doi mat khau
- forgot/reset password
- confirm email
- resend email confirmation
- gui email qua SMTP abstraction (`IEmailSender`)
- seed role va admin mac dinh

Frontend implementation va route map rieng cho auth client duoc mo ta tai `docs/features/client-authentication.md`.
Nhung khoang trong backend con thieu de ho tro day du login UX moi o client duoc ghi tai `docs/features/authentication-backend-gaps.md`.

## File chinh

- Application contracts: `examxy.Application/Abstractions/Identity`
- Email abstraction: `examxy.Application/Abstractions/Email`
- Infrastructure identity services: `examxy.Infrastructure/Identity/Services`
- Infrastructure email services/options: `examxy.Infrastructure/Email`
- Identity error mapping: `examxy.Infrastructure/Identity/Services/IdentityExceptionFactory.cs`
- DbContext: `examxy.Infrastructure/Persistence/AppDbContext.cs`
- API controller: `examxy.Server/Controllers/AuthController.cs`
- Global error handling: `examxy.Server/Middleware/GlobalExceptionHandlingMiddleware.cs`

## Luong tong quat

1. `ValidateModelStateFilter` doi loi DTO/model binding thanh `ValidationException`.
2. Controller nhan request va goi abstraction trong Application.
3. Infrastructure implement logic qua ASP.NET Identity, JWT, EF Core, va SMTP email sender.
4. `register` tao user, gan role mac dinh, gui email confirmation, roi moi tra token pair.
5. `login` yeu cau email da duoc confirm; user chua confirm se bi chan truoc khi tao token moi.
6. `forgot-password` va `resend-email-confirmation` giu privacy behavior:
   - email khong ton tai van tra `204`
   - email chua confirm moi duoc gui reset password
   - email da confirm se khong gui lai confirm email
7. `reset-password` va `confirm-email` nhan token da duoc URL-safe encode tu link frontend, sau do decode lai truoc khi goi ASP.NET Identity.
8. `GlobalExceptionHandlingMiddleware` doi exception thanh JSON response thong nhat.
9. Refresh token duoc luu trong bang `RefreshTokens`.

## Email flow hien tai

- `POST /api/auth/register`
  - tao user voi `EmailConfirmed = false`
  - gui email confirmation ngay sau khi tao user thanh cong
  - neu gui email that bai thi request that bai thay vi silent success
- `POST /api/auth/forgot-password`
  - chi gui email reset password cho user ton tai va da confirm email
- `POST /api/auth/resend-email-confirmation`
  - chi gui lai email confirmation cho user ton tai va chua confirm
- Email sender hien tai la `SmtpEmailSender` dung MailKit, nhung business code chi phu thuoc `IEmailSender`

## Email template hien tai

- Mail auth dung chung factory template: `examxy.Infrastructure/Email/AuthEmailTemplateFactory.cs`
- Subject da duoc chuan hoa:
  - `Examxy: Confirm your email address`
  - `Examxy: Reset your password`
- Moi email gom:
  - heading ngan gon
  - doan intro mo ta ly do nhan mail
  - CTA button trong HTML
  - plain-text fallback co chua link day du
  - doan outro nhac nguoi dung co the bo qua neu khong phai request cua ho
- Confirmation va reset password deu dung link frontend co token URL-safe encode

## Trang thai xac nhan E2E

- Da xac nhan SMTP Brevo gui duoc mail that su tren moi truong Development.
- Da xac nhan full flow:
  - register gui confirmation email
  - login bi chan khi chua confirm
  - confirm email bang link that trong email
  - login thanh cong sau khi confirm
  - forgot-password gui reset email
  - reset password bang link that trong email
  - mat khau cu khong login lai duoc, mat khau moi login thanh cong
- Deliverability hien tai van co truong hop mail vao `Spam`, dac biet voi sender chua toi uu domain reputation.

## Mapping status quan trong

- username/email da ton tai: `409 Conflict`
- DTO invalid hoac identity validation fail: `400 Bad Request`
- invalid credentials hoac invalid token: `401 Unauthorized`
- logout khong co access token: `401 Unauthorized`
- logout dung refresh token khong thuoc authenticated user: `403 Forbidden`
- account bi lockout: `403 Forbidden`
- email chua confirm khi login: `403 Forbidden`
- user khong ton tai: `404 Not Found`

## Response loi

Auth endpoints dung chung contract loi cua backend. Xem chi tiet tai `docs/features/error-handling.md`.
Checklist test cap nhat theo source test moi nhat nam o `docs/features/authentication-test-checklist.md`.

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

## Config lien quan

- JWT: `examxy.Server/appsettings*.json` section `Jwt`
- Email SMTP: `examxy.Server/appsettings*.json` section `Email`
- Frontend links cho email: `examxy.Server/appsettings*.json` section `AppUrls`
- Database: `ConnectionStrings:DefaultConnection`
- Seed admin: `IdentitySeed`

## Ghi chu cho lan sau

- Neu doi auth behavior, can so sanh lai giua DTO, interface, service, filter, middleware, va controller.
- Neu doi endpoint auth, cap nhat them checklist test va note cai thien trong `docs/features/authentication-test-checklist.md`.
- Neu bat dau lam social login/OAuth, doc truoc `docs/features/authentication-backend-gaps.md` de giu cung huong API, popup flow, va error contract cho frontend.
- Neu doi provider email, uu tien giu business code phu thuoc `IEmailSender` thay vi provider cu the.
- Neu doi subject/body email, cap nhat lai tai lieu nay va checklist test theo template moi.
- Loi startup/config nhu thieu connection string, JWT secret, `Email`, hoac `AppUrls` khong nam trong API error contract nay.
