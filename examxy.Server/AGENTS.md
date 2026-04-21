# examxy.Server

## Scope
HTTP host, controllers, middleware, authorization policies, OpenAPI metadata, and runtime configuration wiring.

## When you are here
- You are changing controllers, route shape, middleware, authz policy use, OpenAPI docs, or startup wiring.
- You are exposing behavior from Application/Infrastructure through HTTP.
- Do not move business rules, persistence logic, or UI concerns into this layer.

## Read before changing
- Layer ownership and entrypoints -> `../docs/architecture/solution-map.md`
- Auth, token, and identity endpoint behavior -> `../docs/features/authentication.md`, `../docs/features/api-flow-authentication.md`
- Error/status contract -> `../docs/features/error-handling.md`
- Feature endpoint behavior -> `../docs/features/README.md` and the relevant feature doc
- Local runtime config and startup requirements -> `../docs/runbooks/local-development.md`

## Rules
- Keep `Program.cs` and controller wiring aligned with `examxy.Server` as the startup host.
- Keep controllers thin: HTTP mapping, validation, authz, and OpenAPI here; business logic in Application/Infrastructure.
- Preserve the shared API error contract instead of mixing ad-hoc `Unauthorized()`/`NotFound()` responses into exception-based flows.
- Keep OpenAPI summaries, responses, and auth requirements aligned with the real behavior.
- Surface runtime config through options and DI, not controller-local assumptions.

## Verify
- `dotnet build .\examxy.Server\examxy.Server.csproj`
- `dotnet test .\test.Integration\test.Integration.csproj`

## Update docs when
- Route, auth, or token behavior changes -> `../docs/features/authentication.md`, related `../docs/features/api-flow-*.md`
- Error/status mapping changes -> `../docs/features/error-handling.md`
- Startup/config behavior changes -> `../docs/runbooks/local-development.md`
- OpenAPI-visible contract changes -> feature doc plus `../docs/features/README.md` if the canonical feature entry changes

## Review focus
- Controller/service boundary violations
- Authz gaps and wrong policy usage
- OpenAPI or status-code drift from actual runtime behavior
