# 2026-04-01 Global exception handling and model validation

## Symptom

- API errors truoc day chua thong nhat: cho thi controller `return Unauthorized()/NotFound()`, cho thi service throw built-in exception.
- DTO validation co the tra ve ASP.NET default `400` thay vi contract loi rieng cua repo.

## Root cause

- Chua co shared exception hierarchy dung chung cho backend.
- `ApiController` model validation short-circuit som, nen neu khong suppress thi middleware khong co co hoi chuan hoa response.
- Identity errors tu ASP.NET Identity duoc pass len nhu chuoi message hoac built-in exception, chua co mapping ro rang.

## Fix

- Them `AppException` hierarchy trong `examxy.Application/Exceptions`.
- Them `IdentityExceptionFactory` de map `IdentityError` sang `ConflictException` hoac `ValidationException`.
- Them `ValidateModelStateFilter` va suppress auto invalid model state filter cua ASP.NET Core.
- Them `GlobalExceptionHandlingMiddleware` va `ApiErrorResponse` de tra JSON loi thong nhat.
- Don controller va service ve mot flow exception-based nhat quan.

## Verify

```powershell
dotnet build .\examxy.Server\examxy.Server.csproj
dotnet test .\examxy.slnx
```

## Files or commands to check first

- `examxy.Server/Program.cs`
- `examxy.Server/Middleware/GlobalExceptionHandlingMiddleware.cs`
- `examxy.Server/Filters/ValidateModelStateFilter.cs`
- `examxy.Infrastructure/Identity/Services/IdentityExceptionFactory.cs`
- `examxy.Server/Controllers/AuthController.cs`

## Prevention

- Neu them endpoint moi co API error contract, uu tien throw `AppException`.
- Neu phat sinh built-in exception moi trong request flow, map no vao middleware hoac factory thay vi de client tu doan.
- Neu doi status code hoac response JSON, cap nhat `docs/features/error-handling.md` cung feature doc lien quan.
