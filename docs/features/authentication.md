# Authentication

## Pham vi hien tai

Authentication/Identity hien tai da vuot qua auth-only va dong vai tro foundation cho 3 actor co dinh:

- `Teacher`
- `Student`
- `Admin`

Scope auth hien tai bao gom:

- teacher self-signup qua `POST /api/auth/register`
- student self-signup qua `POST /api/auth/register/student`
- login, refresh token, logout, current user
- change password, forgot/reset password
- confirm email, resend email confirmation
- internal admin provisioning qua `POST /internal/admin-users`
- seed role va backfill role legacy `User` -> `Teacher`
- issue `primaryRole` trong auth response va current-user response

Foundation nghiep vu teacher/student/class duoc tong hop tai `docs/features/identity-class-foundation.md`.
Frontend implementation va route map duoc mo ta tai `docs/features/client-authentication.md`.
Nhung auth gap con lai cho cac luong chua implement, nhu external auth, duoc ghi tai `docs/features/authentication-backend-gaps.md`.
Flow diagrams cho auth sequence nam tai `docs/features/api-flow-authentication.md`.

## Role model hien tai

- Moi account chi co 1 primary role trong pham vi v1.
- `Teacher` la role mac dinh cua public register flow hien tai.
- `Student` duoc tao qua student self-signup hoac qua teacher roster import.
- `Admin` khong di qua public signup; chi duoc cap qua internal API co secret header.
- Auth response va `GET /api/auth/me` deu tra:
  - `roles` de giu kha nang tuong thich
  - `primaryRole` de client route/guard khong phai suy luan tu mang role

## File chinh

- Application contracts:
  - `examxy.Application/Abstractions/Identity`
  - `examxy.Application/Features/Classrooms`
- Infrastructure identity services:
  - `examxy.Infrastructure/Identity/Services`
  - `examxy.Infrastructure/Features/Classrooms`
- Domain classroom entities:
  - `examxy.Domain/Classrooms`
- Infrastructure email services/options: `examxy.Infrastructure/Email`
- Identity error mapping: `examxy.Infrastructure/Identity/Services/IdentityExceptionFactory.cs`
- DbContext: `examxy.Infrastructure/Persistence/AppDbContext.cs`
- Controllers:
  - `examxy.Server/Controllers/AuthController.cs`
  - `examxy.Server/Controllers/TeacherClassesController.cs`
  - `examxy.Server/Controllers/StudentDashboardController.cs`
  - `examxy.Server/Controllers/StudentInvitesController.cs`
  - `examxy.Server/Controllers/InternalAdminUsersController.cs`
- Global error handling: `examxy.Server/Middleware/GlobalExceptionHandlingMiddleware.cs`

## API surface hien tai

### Public auth API

- `POST /api/auth/register`
  - teacher self-signup
- `POST /api/auth/register/student`
  - student self-signup
- `POST /api/auth/login`
- `POST /api/auth/refresh-token`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/change-password`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/confirm-email`
- `POST /api/auth/resend-email-confirmation`

### Role-scoped foundation API

- `GET /api/classes`
- `POST /api/classes`
- `GET /api/classes/{classId}`
- `PUT /api/classes/{classId}`
- `DELETE /api/classes/{classId}`
- `POST /api/classes/{classId}/roster-imports` (multipart file `.xlsx` or `.csv`)
- `POST /api/classes/{classId}/students` (single email)
- `DELETE /api/classes/{classId}/memberships/{membershipId}`
- `POST /api/classes/{classId}/invites/{inviteId}/resend`
- `POST /api/classes/{classId}/invites/{inviteId}/cancel`
- `GET /api/student/dashboard`
- `POST /api/student/invites/claim`

### Internal API

- `POST /internal/admin-users`
  - khong public trong API explorer
  - bat buoc secret header tu `InternalAdminProvisioning`

## Luong tong quat

1. `ValidateModelStateFilter` doi loi DTO/model binding thanh `ValidationException`.
2. Controller nhan request va goi abstraction trong Application.
3. Infrastructure implement logic qua ASP.NET Identity, JWT, EF Core, email sender, va classroom services.
4. Teacher register tao account role `Teacher`, tao `TeacherProfile`, gui email confirmation, roi tra token pair.
5. Student register tao account role `Student`, tao `StudentProfile`, va cho student vao flow onboarding dashboard rieng.
6. Teacher roster import co the:
   - tao invited student moi
   - gui invite cho student da ton tai
   - reject row neu email da ton tai nhung account khong phai `Student`
7. Login yeu cau email da duoc confirm; user chua confirm se bi chan truoc khi tao token moi.
8. `reset-password` va `confirm-email` nhan token da duoc URL-safe encode tu link frontend, sau do decode lai truoc khi goi ASP.NET Identity.
9. `GlobalExceptionHandlingMiddleware` doi exception thanh JSON response thong nhat.
10. Refresh token duoc luu trong bang `RefreshTokens`.

## Ghi nho dang nhap hien tai

Backend hien tai khong co contract rieng cho `Ghi nho dang nhap`:

- `LoginRequestDto` chi nhan `userNameOrEmail` va `password`
- login va refresh-token policy khong phan biet persistent hay non-persistent session
- refresh token expiration hien tai duoc tinh duy nhat theo `Jwt:RefreshTokenExpirationDays`

Dieu nay co nghia:

- checkbox `Ghi nho dang nhap` o frontend hien tai chi quyet dinh noi luu token trong browser
- backend issue cung loai refresh token cho ca hai mode
- neu sau nay muon rut ngan refresh token hoac thay doi policy theo checkbox nay, can mo rong request/response contract va service auth

Phan nay duoc giu nguyen co chu y de uu tien v1. Xem backlog auth tai `docs/features/authentication-backend-gaps.md`.

## Email flow hien tai

- `POST /api/auth/register`
  - tao teacher user voi `EmailConfirmed = false`
  - gui email confirmation ngay sau khi tao user thanh cong
  - neu gui email that bai thi request that bai thay vi silent success
- `POST /api/auth/register/student`
  - tao student user va `StudentProfile`
  - flow active/claim class tiep theo di qua dashboard student va invite claim
- `POST /api/auth/forgot-password`
  - chi gui email reset password cho user ton tai va da confirm email
- `POST /api/auth/resend-email-confirmation`
  - chi gui lai email confirmation cho user ton tai va chua confirm
- `POST /api/classes/{classId}/roster-imports`
  - voi imported student moi, gui activation/set-password email + class invite
  - voi imported student da ton tai, gui class invite email
- Email sender hien tai la `SmtpEmailSender` dung MailKit, nhung business code chi phu thuoc `IEmailSender`

## Mapping status quan trong

- username/email da ton tai: `409 Conflict`
- DTO invalid hoac identity validation fail: `400 Bad Request`
- invalid credentials hoac invalid token: `401 Unauthorized`
- logout khong co access token: `401 Unauthorized`
- logout dung refresh token khong thuoc authenticated user: `403 Forbidden`
- account bi lockout: `403 Forbidden`
- email chua confirm khi login: `403 Forbidden`
- internal admin secret sai: `403 Forbidden`
- user khong ton tai: `404 Not Found`

## Response loi

Auth endpoints va foundation endpoints dung chung contract loi cua backend. Xem chi tiet tai `docs/features/error-handling.md`.
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
- Frontend links cho email va dashboard: `examxy.Server/appsettings*.json` section `AppUrls`
- Database: `ConnectionStrings:DefaultConnection`
- Internal admin bootstrap va maintenance: `InternalAdminProvisioning`
- Internal admin secret/header: `InternalAdminProvisioning`

## Ghi chu cho lan sau

- Neu doi auth behavior, can so sanh lai giua DTO, interface, service, filter, middleware, controller, va client route guard.
- Neu doi endpoint auth hoac role foundation, cap nhat them checklist test va note cai thien trong `docs/features/authentication-test-checklist.md`.
- Neu bat dau lam social login/OAuth, doc truoc `docs/features/authentication-backend-gaps.md`.
- Neu mo rong classroom foundation, doc truoc `docs/features/identity-class-foundation.md`.
- Neu doi provider email, uu tien giu business code phu thuoc `IEmailSender` thay vi provider cu the.
- Loi startup/config nhu thieu connection string, JWT secret, `Email`, `AppUrls`, hoac `InternalAdminProvisioning` khong nam trong API error contract nay.

