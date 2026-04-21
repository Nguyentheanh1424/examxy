# Docs Portal

## Purpose
Entry point for finding the canonical docs for architecture, features, operations, and Codex workflow.

## Applies when
- You are entering the repo and need to find the right source of truth.
- You are deciding which doc owns a concept before editing code or docs.
- You are adding, moving, or consolidating canonical docs.

## Current behavior / flow
- Start with `ai/onboarding.md`, `architecture/solution-map.md`, and `context/current-state.md`.
- Use `features/README.md` to pick the canonical feature doc before reading flow docs.
- Use `runbooks/` for setup, local tooling, migrations, and seeded test-data behavior.
- Use `conventions/` for documentation maintenance rules, frontend source-of-truth routing, and the detailed design-system contract.

## Invariants
- This file routes to canonical docs; it is not the source of truth for feature behavior.
- Each concept should have one canonical document and optional supporting flow docs.
- `AGENTS.md` files stay short and point into `docs/*` instead of duplicating rules.

## Change checklist
- New or moved canonical doc -> update this file and the nearest feature or convention index.
- Architecture or ownership change -> update `architecture/solution-map.md` and `context/current-state.md`.
- Codex workflow or instruction-surface change -> update `ai/onboarding.md` and `conventions/documentation-rules.md`.

## Related
- `docs/ai/onboarding.md`
- `docs/architecture/solution-map.md`
- `docs/context/current-state.md`
- `docs/features/README.md`
- `docs/conventions/documentation-rules.md`
- `docs/conventions/frontend-source-of-truth.md`
