# examxy.Domain

## Scope
Entities, enums, and business state for classrooms, content, question bank, and assessments.

## When you are here
- You are changing domain entities, enums, lifecycle fields, or business state relationships.
- You are refining the state model that Application, Infrastructure, and tests rely on.
- Do not move HTTP, OpenAPI, DI, EF configuration, or UI logic into Domain.

## Read before changing
- Layer boundaries -> `../docs/architecture/solution-map.md`
- Current shipped capability -> `../docs/context/current-state.md`
- Data model and relationships -> `../docs/architecture/database-erd.md`
- Role/class state rules -> `../docs/features/identity-class-foundation.md`
- Feature-specific behavior -> the relevant feature doc in `../docs/features/`

## Rules
- Keep Domain free of infrastructure and transport concerns.
- Preserve aggregate boundaries and naming instead of creating parallel models for the same concept.
- Review downstream impact in Infrastructure mappings, services, DTO mapping, and tests for every entity or enum change.
- Treat status/lifecycle changes as contract changes when they affect API-visible behavior.
- Keep soft-delete and membership/ownership semantics consistent with existing feature docs.

## Verify
- `dotnet build .\examxy.Server\examxy.Server.csproj`
- `dotnet test .\test.Integration\test.Integration.csproj`

## Update docs when
- Entity relationship or lifecycle changes -> `../docs/architecture/database-erd.md`, relevant feature doc
- Role, membership, or ownership rule changes -> `../docs/features/identity-class-foundation.md`
- Shipped capability or constraint changes -> `../docs/context/current-state.md`

## Review focus
- Domain purity and naming consistency
- Lifecycle/status regressions that leak into persistence or API behavior
- Ownership/membership semantics
