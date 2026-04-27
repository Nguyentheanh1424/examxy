# 2026-04-01 Global Exception Handling and Model Validation

## Symptom

- API errors were previously inconsistent: some controllers returned `Unauthorized()/NotFound()`, while others threw built-in exceptions.
- DTO validation could return the default ASP.NET `400` instead of the repository’s unified error contract.

## Root cause

- No shared exception hierarchy across the backend.
- `ApiController` model validation short-circuits early; without suppression, middleware cannot standardize responses.
- Identity errors from ASP.NET Identity were propagated as plain messages or built-in exceptions, without clear mapping.

## Fix

- Added `AppException` hierarchy in `examxy.Application/Exceptions`.
- Added `IdentityExceptionFactory` to map `IdentityError` to `ConflictException` or `ValidationException`.
- Added `ValidateModelStateFilter` and suppressed ASP.NET Core’s automatic invalid model state filter.
- Added `GlobalExceptionHandlingMiddleware` and `ApiErrorResponse` for unified JSON error responses.
- Refactored controllers and services to follow a consistent exception-based flow.

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

- When adding new endpoints with API error contracts, prefer throwing `AppException`.
- If new built-in exceptions appear in request flow, map them in middleware or factory instead of letting the client infer behavior.
- If status codes or response JSON change, update `docs/features/error-handling.md` and related feature docs.
