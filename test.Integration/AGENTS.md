# test.Integration

## Scope
Integration tests for API contracts, authz, error behavior, Swagger/OpenAPI, and cross-layer regressions.

## When you are here
- You are changing HTTP-visible behavior, authz, middleware, DTO contracts, or persistence behavior that surfaces through the API.
- You are adding regression coverage for high-risk backend changes.
- Do not duplicate unit-level implementation details that belong in narrower tests.

## Read before changing
- Auth coverage expectations -> `../docs/features/authentication-test-checklist.md`
- Auth, token, and identity behavior -> `../docs/features/authentication.md`, `../docs/features/api-flow-authentication.md`
- Shared API error contract -> `../docs/features/error-handling.md`
- Feature-specific API behavior -> the relevant feature doc in `../docs/features/`

## Rules
- Use the existing integration host, factories, and `InMemoryEmailSender`.
- For confirm-email and reset-password success paths, read tokens from captured email links instead of generating tokens in a different process.
- Add or update tests when auth, routes, DTO contracts, status mapping, Swagger/OpenAPI, or high-risk regressions change.
- Keep assertions aligned with the documented API contract, not incidental implementation details.
- Prefer one integration test to cover a user-visible contract boundary, not multiple near-duplicate setup variations.

## Verify
- `dotnet test .\test.Integration\test.Integration.csproj`

## Update docs when
- Coverage strategy or auth expectations change -> `../docs/features/authentication-test-checklist.md`
- API behavior or error mapping changes -> relevant feature doc and `../docs/features/error-handling.md`
- A debugging trap is worth preserving -> `../docs/lessons/README.md` or a new lesson

## Review focus
- Missing coverage for auth, contracts, and regression-prone flows
- Invalid token-generation shortcuts in email flows
- Drift between documented API behavior and tested behavior
