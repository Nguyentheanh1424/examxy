# Solution Map

## Tong quan

Repo hien tai la monorepo nho gom backend .NET, frontend React/Vite, va mot bo test projects. File solution la `examxy.slnx`.

## Cau truc project

- `examxy.Server`: web host ASP.NET Core, chua `Program.cs`, controllers, middleware, filters, appsettings, va entry point runtime.
- `examxy.Application`: contracts, abstractions, va shared `AppException` hierarchy dung chung cho backend request flow.
- `examxy.Domain`: domain core, entity/value object/rule co tinh on dinh lau dai.
- `examxy.Infrastructure`: persistence, Identity, JWT, seeding, va implementation cho abstractions.
- `examxy.client`: frontend React 19 + Vite.
- `test.Application`: test cho application layer.
- `test.Domain`: test cho domain layer.
- `test.Integration`: test tich hop, da tham chieu Application, Domain, Infrastructure, Server.

## Entry point quan trong

- Backend runtime: `examxy.Server/Program.cs`
- Global exception middleware: `examxy.Server/Middleware/GlobalExceptionHandlingMiddleware.cs`
- Model validation filter: `examxy.Server/Filters/ValidateModelStateFilter.cs`
- API error contract: `examxy.Server/Contracts/ApiErrorResponse.cs`
- Shared exceptions: `examxy.Application/Exceptions/*`
- DbContext: `examxy.Infrastructure/Persistence/AppDbContext.cs`
- Infrastructure wiring: `examxy.Infrastructure/Identity/DependencyInjection/ServiceCollectionExtensions.cs`
- Auth controller: `examxy.Server/Controllers/AuthController.cs`
- Identity error mapping: `examxy.Infrastructure/Identity/Services/IdentityExceptionFactory.cs`
- Migration scripts: `scripts/*.ps1`

## Phan biet host

Trong repo co ca `examxy.API.csproj` va `examxy.Server.csproj`, nhung host dang duoc wire va dung thuc te hien nay la `examxy.Server.csproj`. Tai lieu va script nen uu tien `examxy.Server` lam startup project.

## Luong backend can nho

1. `Program.cs` wire controllers, validation filter, middleware, auth, va authorization.
2. Controllers goi abstractions trong `examxy.Application`.
3. Infrastructure implement logic qua ASP.NET Identity, JWT, EF Core, va mapping Identity errors.
4. `GlobalExceptionHandlingMiddleware` doi exception thanh response JSON thong nhat cho API.
