# Documentation Rules

## Purpose

Source of truth for how this repo maintains canonical docs, `AGENTS.md` files, and documentation update discipline.

## Applies when

- Code behavior, contracts, architecture, or setup changes.
- A recurring agent mistake exposes missing or misplaced guidance.
- A doc feels duplicated, unclear, or no longer maps to real code.

## Current behavior / flow

- Pick one canonical doc for the concept you are changing.
- Update the nearest index doc only to point to that canonical doc.
- Update the closest `AGENTS.md` only when routing, local rules, or validation guidance changes.
- Update `CLAUDE.md` when repository-wide agent workflow, docs-first routing, or GitNexus usage rules change.
- Add a lesson doc only when a failure mode is non-obvious and likely to recur.

## Invariants

- One concept, one canonical document.
- `AGENTS.md` files reference docs; they do not become mini-guides.
- Root `AGENTS.md` stays monorepo-wide; module-local rules live in child `AGENTS.md`.
- `docs/ai/onboarding.md` holds the detailed agent workflow; `AGENTS.md` and `CLAUDE.md` stay short and route into it.
- Keep GitNexus-managed blocks inside their existing markers, and keep repo-specific manual guidance outside those markers so GitNexus analyze can safely refresh generated content.
- Flow docs support canonical docs and should not replace them.

## Change checklist

- Architecture or ownership change -> `docs/architecture/solution-map.md`, `docs/context/current-state.md`
- Feature behavior or contract change -> relevant `docs/features/*` doc and feature index if canonical routing changed
- Startup, config, migration, or script change -> `docs/runbooks/local-development.md`
- Codex routing, execution gate, or instruction-surface change -> `docs/ai/onboarding.md`, nearest `AGENTS.md`, `CLAUDE.md`, `.codex/config.toml` if needed
- Important bugfix/debugging lesson -> add or update a file in `docs/lessons/`

## Related

- `docs/README.md`
- `docs/ai/onboarding.md`
- `docs/architecture/solution-map.md`
- `docs/features/README.md`
- `AGENTS.md`
- `CLAUDE.md`
