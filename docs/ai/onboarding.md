# AI Onboarding

## Purpose
Source of truth for how Codex should enter this repo, discover instructions, and choose the first docs to read.

## Applies when
- A new Codex session starts in this repository.
- You are adding or moving module-level `AGENTS.md` files.
- You are changing `.codex/config.toml` or the docs-first routing rules.

## Current behavior / flow
- Codex discovers root `AGENTS.md`, then the closest child `AGENTS.md` files along the working-directory path.
- Module-level `AGENTS.md` files exist in `examxy.client`, `examxy.Server`, `examxy.Infrastructure`, `examxy.Application`, `examxy.Domain`, `scripts`, and `test.Integration`.
- Start doc reading from `docs/README.md`, then `docs/architecture/solution-map.md`, `docs/context/current-state.md`, and the relevant feature or runbook doc for the task.
- `.codex/config.toml` shares project-root and instruction-size settings for trusted local environments.

## Invariants
- Root `AGENTS.md` owns monorepo-wide routing and boundary rules only.
- Child `AGENTS.md` files own module-local guidance; use `AGENTS.override.md` only when a child must replace parent logic.
- `AGENTS.md` files route to docs and stay short; detailed rationale lives in `docs/*`.
- `examxy.Server` remains the active startup host for backend/runtime guidance.

## Change checklist
- New module with distinct ownership -> add a child `AGENTS.md` and list it here.
- Changed doc routing or instruction-surface rules -> update root `AGENTS.md` and `docs/conventions/documentation-rules.md`.
- Changed `.codex/config.toml` discovery behavior -> update this file and verify trust assumptions still hold.

## Related
- `AGENTS.md`
- `docs/README.md`
- `docs/conventions/documentation-rules.md`
- `.codex/config.toml`
