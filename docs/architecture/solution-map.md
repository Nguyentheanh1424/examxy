# Solution Map

## Tong quan

Repo hien tai la monorepo nho gom backend .NET, frontend React/Vite, va mot bo test projects. File solution la `examxy.slnx`.
He thong da co auth foundation + role-based class foundation cho `Teacher`, `Student`, va `Admin`.

## Cau truc project

- `examxy.Server`: web host ASP.NET Core, chua `Program.cs`, controllers, middleware, filters, appsettings, va entry point runtime.
- `examxy.Application`: contracts, abstractions, va shared `AppException` hierarchy dung chung cho backend request flow.
- `examxy.Domain`: domain core, entity/value object/rule co tinh on dinh lau dai.
- `examxy.Infrastructure`: persistence, Identity, JWT, seeding, classroom foundation, email templating, va implementation cho abstractions.
- `examxy.client`: frontend React 19 + Vite, hien la role-based app shell co auth context, session persistence, teacher/student/admin dashboards, va class foundation screens.
- `test.Application`: test cho application layer.
- `test.Domain`: test cho domain layer.
- `test.Integration`: test tich hop, da tham chieu Application, Domain, Infrastructure, Server.

## Entry point quan trong

- Backend runtime: `examxy.Server/Program.cs`
- Frontend router: `examxy.client/src/app/router.tsx`
- Frontend auth provider: `examxy.client/src/features/auth/auth-context.tsx`
- Frontend auth API layer: `examxy.client/src/features/auth/lib/auth-api.ts`
- Frontend classroom API layer: `examxy.client/src/features/classrooms/lib/class-api.ts`
- Global exception middleware: `examxy.Server/Middleware/GlobalExceptionHandlingMiddleware.cs`
- Model validation filter: `examxy.Server/Filters/ValidateModelStateFilter.cs`
- API error contract: `examxy.Server/Contracts/ApiErrorResponse.cs`
- Shared exceptions: `examxy.Application/Exceptions/*`
- DbContext: `examxy.Infrastructure/Persistence/AppDbContext.cs`
- Infrastructure wiring: `examxy.Infrastructure/Identity/DependencyInjection/ServiceCollectionExtensions.cs`
- Auth controller: `examxy.Server/Controllers/AuthController.cs`
- Teacher class controller: `examxy.Server/Controllers/TeacherClassesController.cs`
- Student dashboard controller: `examxy.Server/Controllers/StudentDashboardController.cs`
- Student invite controller: `examxy.Server/Controllers/StudentInvitesController.cs`
- Internal admin controller: `examxy.Server/Controllers/InternalAdminUsersController.cs`
- Identity error mapping: `examxy.Infrastructure/Identity/Services/IdentityExceptionFactory.cs`
- Migration scripts: `scripts/*.ps1`

## Phan biet host

Trong repo co ca `examxy.API.csproj` va `examxy.Server.csproj`, nhung host dang duoc wire va dung thuc te hien nay la `examxy.Server.csproj`. Tai lieu va script nen uu tien `examxy.Server` lam startup project.

## Luong backend can nho

1. `Program.cs` wire controllers, validation filter, middleware, auth, va authorization.
2. Controllers goi abstractions trong `examxy.Application`.
3. Infrastructure implement logic qua ASP.NET Identity, JWT, EF Core, email sender, classroom services, va mapping Identity errors.
4. Auth response/current-user response tra `primaryRole` de frontend route theo role.
5. Teacher flows di qua `api/teacher/classes` va roster import; student flows di qua `api/student/dashboard` va invite claim.
6. Internal admin provisioning di qua `internal/admin-users` va duoc bao ve bang secret header.
7. `GlobalExceptionHandlingMiddleware` doi exception thanh response JSON thong nhat cho API.
8. `examxy.client` dung relative `/api`, localStorage/sessionStorage session, role-based redirect, va refresh token retry 1 lan cho protected request.

## Tai lieu nen doc cung nhau

- `docs/features/authentication.md`
- `docs/features/client-authentication.md`
- `docs/features/identity-class-foundation.md`
- `docs/features/authentication-backend-gaps.md`
