# Solution Map

## Purpose
Source of truth for module boundaries, dependency direction, entrypoints, and where backend/frontend responsibilities live.

## Applies when
- You are unsure which module owns a change.
- You are moving code across layers or adding a new dependency.
- You are changing startup, DI wiring, persistence ownership, or a cross-module contract.

## Current behavior / flow
- Repo shape:
  - `examxy.Server`: HTTP host, controllers, middleware, Swagger/OpenAPI, runtime startup
  - `examxy.Application`: contracts, DTOs, abstractions, shared exceptions
  - `examxy.Domain`: entities and enums
  - `examxy.Infrastructure`: EF Core, Identity/JWT/email, DI wiring, service implementations, paper exam template/config storage
  - `examxy.client`: React/Vite frontend
  - `scripts`: local migration and seed helpers
  - `test.Integration`: API/auth/OpenAPI integration tests
- Dependency direction:
  - `examxy.Server` depends on `examxy.Application` and `examxy.Infrastructure`
  - `examxy.Infrastructure` depends on `examxy.Application` and `examxy.Domain`
  - `examxy.Application` depends on `examxy.Domain`
  - `examxy.Domain` depends on no project layer
- Backend implementation flow:
  1. Define or update contract in `examxy.Application`
  2. Model business state in `examxy.Domain`
  3. Implement persistence/runtime behavior in `examxy.Infrastructure`
  4. Expose behavior through `examxy.Server`
  5. Cover HTTP-visible changes in `test.Integration`

## Invariants
- `examxy.Server` is the active backend startup host.
- HTTP concerns stay in Server, contracts in Application, business state in Domain, implementations in Infrastructure, UI in `examxy.client`.
- Backend authorization is enforced on the server side; frontend role logic is for routing and visibility only.
- Scripts and tests must follow the same runtime entrypoints and contracts as production code.

## Change checklist
- Boundary or ownership change -> update this file, `docs/context/current-state.md`, and the nearest `AGENTS.md`
- New feature module or API surface -> update the relevant `docs/features/*` doc and `docs/features/README.md`
- Startup or DI wiring change -> update `docs/runbooks/local-development.md`

## Related
- `docs/context/current-state.md`
- `docs/features/README.md`
- `docs/runbooks/local-development.md`
- `examxy.Server/Program.cs`
- `examxy.Infrastructure/Identity/DependencyInjection/ServiceCollectionExtensions.cs`
- `examxy.Infrastructure/Persistence/AppDbContext.cs`
