# examxy.Infrastructure

## Scope
Persistence, Identity, email, token services, DI wiring, and concrete feature implementations.

## When you are here
- You are changing EF Core mappings, migrations, Identity/email/token logic, DI registration, or service implementations.
- You are wiring Application contracts to Domain state and runtime infrastructure.
- Do not place HTTP/controller concerns or UI concerns in this layer.

## Read before changing
- Layer boundaries and wiring entrypoints -> `../docs/architecture/solution-map.md`
- Auth, token, and email behavior -> `../docs/features/authentication.md`
- Persistence/migration/local tooling behavior -> `../docs/runbooks/local-development.md`, `../docs/lessons/2026-03-31-migration-script-lessons.md`
- Feature-specific persistence behavior -> `../docs/features/README.md` and the relevant feature doc

## Rules
- Keep contracts in Application and business state in Domain; Infrastructure owns implementations and external IO.
- Use `Persistence/AppDbContext.cs`, `Persistence/Migrations/*`, and `Features/*/Configurations/*` as the persistence source of truth.
- Keep Identity/email/token behavior aligned with Application abstractions and Server runtime config.
- Do not change migration or EF tooling behavior without checking the scripts and runbook that use it.
- Treat auth, persistence, and config changes as high-risk and update tests/docs in the same change.

## Verify
- `dotnet build .\examxy.Server\examxy.Server.csproj`
- `dotnet test .\test.Integration\test.Integration.csproj`
- For migration/tooling changes, smoke-check the relevant script from repo root in sequence

## Update docs when
- Schema, migration, or local tooling behavior changes -> `../docs/runbooks/local-development.md`, `../docs/lessons/2026-03-31-migration-script-lessons.md`
- Auth, email, or token flow changes -> `../docs/features/authentication.md`, related flow docs, and auth test checklist if coverage expectations move
- Feature persistence behavior changes -> the relevant feature doc and `../docs/context/current-state.md` when shipped capability changes

## Review focus
- Persistence/runtime leaks into Domain or Application
- Migration safety and config drift
- Token/email behavior drift from controllers, client, or tests
