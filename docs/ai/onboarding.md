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
- Before any code change, present an execution plan and wait for explicit user approval before writing files, applying patches, or taking other mutating actions.
- For code understanding, start with GitNexus repo context to confirm repo identity and index freshness, then use `query` for execution flows and `context` for symbol-level detail before falling back to grep or file search.
- When GitNexus needs a refresh on Windows, run `npx.cmd gitnexus@1.6.4-rc.7 analyze --force` from repo root. Do not use `npx gitnexus@latest analyze --force` for now; PowerShell may invoke blocked `.ps1` shims, and `gitnexus@latest` currently resolves to analyzer `1.6.3`, which fails this repo during `scopeResolution`.
- Before editing a function, class, or method, run GitNexus `impact` and report the blast radius to the user; before committing, run `detect_changes` to verify the expected scope.
- `.codex/config.toml` shares project-root and instruction-size settings for trusted local environments.

## Invariants

- Root `AGENTS.md` owns monorepo-wide routing and boundary rules only.
- Child `AGENTS.md` files own module-local guidance; use `AGENTS.override.md` only when a child must replace parent logic.
- `AGENTS.md` files route to docs and stay short; detailed rationale lives in `docs/*`.
- `examxy.Server` remains the active startup host for backend/runtime guidance.
- `.codex/config.toml` does not currently need changes for this workflow; the existing discovery settings are sufficient unless repo-root detection or doc-size limits change.

## Change checklist

- New module with distinct ownership -> add a child `AGENTS.md` and list it here.
- Changed doc routing, execution gate, or GitNexus workflow -> update root `AGENTS.md`, `CLAUDE.md`, and `docs/conventions/documentation-rules.md`.
- Changed `.codex/config.toml` discovery behavior -> update this file and verify trust assumptions still hold.

## Related

- `AGENTS.md`
- `CLAUDE.md`
- `docs/README.md`
- `docs/conventions/documentation-rules.md`
- `.codex/config.toml`
