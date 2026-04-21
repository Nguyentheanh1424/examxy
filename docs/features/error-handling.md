# Error Handling

## Purpose
Canonical source of truth for the shared backend API error contract, exception hierarchy, and status mapping rules.

## Applies when
- You change exception types, middleware mapping, model-validation handling, or error response JSON.
- You change how client code interprets backend validation or auth errors.
- You add a new API-visible failure path.

## Current behavior / flow
- Shared error contract: `ApiErrorResponse` with `statusCode`, `code`, `message`, `traceId`, and optional `errors`.
- Core exception hierarchy:
  - `ValidationException` -> `400`
  - `UnauthorizedException` -> `401`
  - `ForbiddenException` -> `403`
  - `NotFoundException` -> `404`
  - `ConflictException` -> `409`
- Pipeline:
  1. `ValidateModelStateFilter` converts DTO/model-binding failures to `ValidationException`
  2. controller/service code throws `AppException` or a mapped equivalent
  3. `GlobalExceptionHandlingMiddleware` converts exceptions to `ApiErrorResponse`
  4. unhandled exceptions fall back to `500`
- Important mapping:
  - duplicate username/email/role -> `ConflictException`
  - remaining `IdentityError` validation issues -> `ValidationException`
  - invalid credentials or invalid token -> `UnauthorizedException`
  - lockout or policy denial -> `ForbiddenException`
  - missing user/resource -> `NotFoundException`

## Invariants
- API-visible failures use the shared JSON error contract instead of ad-hoc response bodies.
- `errors` is reserved for validation-style failures.
- Controller flows should not mix arbitrary inline status helpers with the shared exception contract for the same behavior path.
- Startup/config failures outside the request pipeline are not part of this API error contract.

## Change checklist
- Exception/status mapping change -> update middleware/filter/service code, this doc, and integration tests
- New API-visible failure shape -> update client error mapping expectations in `docs/features/client-authentication.md` if relevant
- Validation behavior change -> update form-handling tests and any feature doc that calls out the affected status

## Related
- Code:
  - `examxy.Application/Exceptions/*`
  - `examxy.Server/Filters/ValidateModelStateFilter.cs`
  - `examxy.Server/Middleware/GlobalExceptionHandlingMiddleware.cs`
  - `examxy.Server/Contracts/ApiErrorResponse.cs`
  - `examxy.Infrastructure/Identity/Services/IdentityExceptionFactory.cs`
- Docs:
  - `docs/features/authentication.md`
  - `docs/features/client-authentication.md`
