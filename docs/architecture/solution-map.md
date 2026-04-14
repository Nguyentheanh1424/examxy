# Solution Map

## Overview

Repo la monorepo gom backend .NET + frontend React/Vite + integration tests.
Runtime host chinh la `examxy.Server` (khong phai host API cu).

## Project Structure

- `examxy.Server`
  - HTTP host, controllers, middleware, swagger/openapi.
- `examxy.Application`
  - feature contracts (interfaces + DTO) va shared exception contracts.
- `examxy.Domain`
  - core entities/enums theo business boundary.
- `examxy.Infrastructure`
  - EF Core persistence, Identity/JWT/email, service implementations.
- `examxy.client`
  - FE app (auth/session/role route + class flows).
- `test.Integration`
  - API + auth + swagger integration tests.

## Backend Feature Boundaries (Current)

### Classrooms

- Application: `examxy.Application/Features/Classrooms/*`
- Domain: `examxy.Domain/Classrooms/*`
- Infrastructure: `examxy.Infrastructure/Features/Classrooms/*`
- APIs: `TeacherClassesController`, `StudentDashboardController`, `StudentInvitesController`

### Class Content

- Application: `examxy.Application/Features/ClassContent/*`
- Domain: `examxy.Domain/ClassContent/*`
- Infrastructure: `examxy.Infrastructure/Features/ClassContent/*`
- APIs: `ClassContentController`

### Question Bank

- Application: `examxy.Application/Features/QuestionBank/*`
- Domain: `examxy.Domain/QuestionBank/*`
- Infrastructure: `examxy.Infrastructure/Features/QuestionBank/*`
- APIs: `QuestionBankController`

### Assessments

- Application: `examxy.Application/Features/Assessments/*`
- Domain: `examxy.Domain/Assessments/*`
- Infrastructure: `examxy.Infrastructure/Features/Assessments/*`
- APIs: `ClassAssessmentsController`

### Persistence

- DbContext: `examxy.Infrastructure/Persistence/AppDbContext.cs`
- Database ERD: `docs/architecture/database-erd.md`
- EF configurations:
  - `Infrastructure/Features/Classrooms/Configurations/*`
  - `Infrastructure/Features/ClassContent/Configurations/*`
  - `Infrastructure/Features/QuestionBank/Configurations/*`
  - `Infrastructure/Features/Assessments/Configurations/*`
- Migrations: `examxy.Infrastructure/Persistence/Migrations/*`

## API Route Conventions

- Auth: `/api/auth/*`
- Class foundation + roster: `/api/classes/*` (teacher-only endpoints co policy)
- Class content dashboard/feed/post/comment/reaction/schedule: `/api/classes/{classId}/*`
- Question bank (teacher-global): `/api/question-bank/questions/*`
- Assessments in class: `/api/classes/{classId}/assessments/*`
- Student dashboard/invite claim:
  - `/api/student/dashboard`
  - `/api/student/invites/claim`

## Authorization Model

- Policy-based role guard tai controller/action:
  - `teacher_only`, `student_only`, `admin_only`.
- Class-scoped access check trong service:
  - teacher owner hoac active student member.
- Backend la enforcement layer cuoi; FE chi dung role de show/hide UI.

## Implementation Flow (Expected)

1. Define/update contract in `Application/Features/<Feature>`.
2. Put business entities/enums in `Domain/<Feature>`.
3. Implement service in `Infrastructure/Features/<Feature>`.
4. Register DI in `Infrastructure/Identity/DependencyInjection/ServiceCollectionExtensions.cs`.
5. Expose API in `Server/Controllers`.
6. Add/adjust integration tests in `test.Integration`.
7. Update docs in `docs/features/*` + `docs/context/current-state.md`.

## High-signal Entry Files

- Startup: `examxy.Server/Program.cs`
- DI wiring: `examxy.Infrastructure/Identity/DependencyInjection/ServiceCollectionExtensions.cs`
- Db model: `examxy.Infrastructure/Persistence/AppDbContext.cs`
- Global API errors: `examxy.Server/Middleware/GlobalExceptionHandlingMiddleware.cs`
- API contract docs entry: `docs/features/README.md`
