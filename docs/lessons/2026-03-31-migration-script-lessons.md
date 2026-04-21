# Migration Script Lessons

## Purpose
Preserve the known failure modes and prevention rules for migration and reset scripts.

## Applies when
- You are debugging `scripts/*.ps1`.
- You are changing EF tooling wiring, migration startup host, or reset-dev safeguards.
- A migration command appears to succeed or fail in a surprising way.

## Current behavior / flow
- Known symptoms:
  - `dotnet ef` fails even when the script looks correct
  - script logs success while the underlying command failed
  - `migrate-reset-dev` can target the wrong database if guards are weak
  - running multiple EF commands in parallel causes build-host file conflicts
- Root causes already seen:
  - wrong startup project
  - missing EF design package in startup host
  - missing `$LASTEXITCODE` checks
  - reset flow not forcing Development/local checks
  - parallel EF tooling
- First files to inspect:
  - `scripts/*.ps1`
  - `examxy.Server/examxy.Server.csproj`
  - `examxy.Server/appsettings.Development.json`
  - `examxy.Server/Program.cs`
  - `examxy.Infrastructure/Persistence/AppDbContext.cs`

## Invariants
- EF tooling uses `examxy.Server` as the startup host.
- Script wrappers must fail when the native command fails.
- EF tooling should be run in sequence, not in parallel.
- Reset-dev remains guarded for Development and local database usage only.

## Change checklist
- Script safety or startup-host fix -> update this lesson and `docs/runbooks/local-development.md`
- New recurring failure mode -> append it here or add a new lesson if it is a separate class of problem
- EF tooling dependency change -> verify the startup project and script assumptions still match

## Related
- `docs/runbooks/local-development.md`
- `scripts/`
- `examxy.Server/examxy.Server.csproj`
- `examxy.Infrastructure/Persistence/AppDbContext.cs`
