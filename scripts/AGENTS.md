# scripts

## Scope
Local migration, reset, and seed helper scripts used from repo root.

## When you are here
- You are changing PowerShell scripts for EF tooling, migrations, reset flows, or test-data seeding.
- You are aligning script behavior with `examxy.Server` startup and Infrastructure persistence.
- Do not treat these scripts as app runtime logic or hide business behavior changes here.

## Read before changing
- Local setup and script usage -> `../docs/runbooks/local-development.md`
- Known migration-script failure modes -> `../docs/lessons/2026-03-31-migration-script-lessons.md`
- Seed dataset behavior -> `../docs/runbooks/test-data-catalog.md`

## Rules
- Keep `examxy.Server` as the startup host for EF tooling.
- Never assume a native `dotnet ef` command succeeded without checking the exit code.
- Do not run EF tooling in parallel.
- Keep `migrate-reset-dev.ps1` guarded for Development and local database use only.
- Keep seed scripts aligned with the current internal test-data API contract and shared-secret headers.

## Verify
- Run only the smallest relevant script smoke check from repo root, in sequence.
- Start migration wiring checks with `.\scripts\migrate-list.ps1` and `.\scripts\migrate-update.ps1`.

## Update docs when
- Script usage or guard behavior changes -> `../docs/runbooks/local-development.md`
- Seed dataset or seed flow changes -> `../docs/runbooks/test-data-catalog.md`
- A new script failure mode is worth preserving -> `../docs/lessons/2026-03-31-migration-script-lessons.md` or a new lesson

## Review focus
- Destructive reset behavior
- Wrong startup host or config assumptions
- Silent script success when native commands actually failed
