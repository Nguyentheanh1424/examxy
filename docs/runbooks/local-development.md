# Local Development

## Purpose
Canonical source of truth for local setup, startup commands, migration scripts, and config required to run Examxy locally.

## Applies when
- You are starting backend or frontend locally.
- You are changing startup, local config, migration tooling, or seed-script behavior.
- You need the smallest valid local verification command for a docs or code change.

## Current behavior / flow
- Requirements:
  - .NET SDK for `net10.0`
  - Node.js for `examxy.client`
  - local PostgreSQL
  - SMTP credentials only if testing real email flow
- Backend startup:
  - `dotnet build .\examxy.Server\examxy.Server.csproj`
  - `dotnet run --project .\examxy.Server\examxy.Server.csproj`
- Frontend startup from `examxy.client`:
  - `npm install`
  - `npm run dev`
  - `npm run test:run`
  - `npm run build`
- Migration and seed scripts from repo root:
  - `.\scripts\migrate-list.ps1`
  - `.\scripts\migrate-add.ps1 -Name <Name>`
  - `.\scripts\migrate-update.ps1`
  - `.\scripts\migrate-remove.ps1`
  - `.\scripts\migrate-reset-dev.ps1`
  - `.\scripts\seed-test-class-dashboard.ps1 ...`
- Required runtime config sections:
  - `ConnectionStrings:DefaultConnection`
  - `Jwt:*`
  - `Email:*`
  - `AppUrls:*`
  - `InternalAdminProvisioning:*`
  - `InternalTestDataProvisioning:*`

## Invariants
- `examxy.Server` is the backend startup host for local runtime and EF tooling.
- Frontend API base defaults to relative `/api` unless `VITE_API_BASE_URL` overrides it.
- `migrate-reset-dev.ps1` is dev-only and should not be used against non-local databases.
- Auth email flows depend on the configured `Email` and `AppUrls` sections.

## Change checklist
- Startup command, config requirement, or host change -> update this doc and `docs/architecture/solution-map.md`
- Migration or seed script behavior change -> update this doc and the relevant script lesson or dataset catalog
- Auth/email local behavior change -> update `docs/features/authentication.md`

## Related
- `docs/lessons/2026-03-31-migration-script-lessons.md`
- `docs/runbooks/test-data-catalog.md`
- `scripts/`
- `examxy.Server/Program.cs`
