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
- seed role va admin mac dinh

## File chinh

- Application contracts: `examxy.Application/Abstractions/Identity`
- Shared exceptions: `examxy.Application/Exceptions`
- Infrastructure models/services: `examxy.Infrastructure/Identity`
- Identity error mapping: `examxy.Infrastructure/Identity/Services/IdentityExceptionFactory.cs`
- DbContext: `examxy.Infrastructure/Persistence/AppDbContext.cs`
- API controller: `examxy.Server/Controllers/AuthController.cs`
- Global error handling: `examxy.Server/Middleware/GlobalExceptionHandlingMiddleware.cs`

## Luong tong quat

1. `ValidateModelStateFilter` doi loi DTO/model binding thanh `ValidationException`.
2. Controller nhan request va goi abstraction trong Application.
3. Infrastructure implement logic qua ASP.NET Identity, JWT, va EF Core.
4. Service throw `AppException` hoac map `IdentityError` qua `IdentityExceptionFactory`.
5. `GlobalExceptionHandlingMiddleware` doi exception thanh JSON response thong nhat.
6. Refresh token duoc luu trong bang `RefreshTokens`.

## Mapping status quan trong

- username/email da ton tai: `409 Conflict`
- DTO invalid hoac identity validation fail: `400 Bad Request`
- invalid credentials hoac invalid token: `401 Unauthorized`
- account bi lockout: `403 Forbidden`
- user khong ton tai: `404 Not Found`

## Response loi

Auth endpoints dung chung contract loi cua backend. Xem chi tiet tai `docs/features/error-handling.md`.

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
- Database: `ConnectionStrings:DefaultConnection`
- Seed admin: `IdentitySeed`

## Ghi chu cho lan sau

- Neu doi auth behavior, can so sanh lai giua DTO, interface, service, filter, middleware, va controller.
- Neu them bang hoac field Identity, can cap nhat migration va runbook migrate.
- Neu bo sung email sender that su, cap nhat tai lieu nay voi flow forgot/reset/confirm email.
- Loi startup/config nhu thieu connection string hoac JWT secret khong nam trong API error contract nay.
