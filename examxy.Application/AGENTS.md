# examxy.Application

## Scope
Shared contracts, DTOs, abstractions, and application-level exceptions used across the backend.

## When you are here
- You are changing an interface, DTO, exception, or feature contract consumed by Server and Infrastructure.
- You are defining how a use case is represented, not how it is stored or exposed over HTTP.
- Do not add HTTP, EF Core, SMTP, filesystem, or UI concerns here.

## Read before changing
- Layer boundaries -> `../docs/architecture/solution-map.md`
- Current shipped capability -> `../docs/context/current-state.md`
- Auth contract change -> `../docs/features/authentication.md`
- Feature contract change -> `../docs/features/README.md` and the relevant feature doc
- Error contract change -> `../docs/features/error-handling.md`

## Rules
- Keep this layer contract-first and framework-light.
- Preserve dependency direction: Application may depend on Domain, not on Server or Infrastructure.
- Review all consumers in Server, Infrastructure, and tests before finalizing a contract change.
- Prefer additive changes unless every caller is updated together.
- Keep exception semantics aligned with the shared API error contract.

## Verify
- `dotnet build .\examxy.Server\examxy.Server.csproj`
- `dotnet test .\test.Integration\test.Integration.csproj`

## Update docs when
- DTO or workflow contract changes -> the relevant feature doc and flow doc
- Exception semantics change -> `../docs/features/error-handling.md`
- Shipped capability or constraint changes -> `../docs/context/current-state.md`

## Review focus
- Contract drift across layers
- Framework leakage into Application
- Exception semantics that no longer match HTTP or client expectations
