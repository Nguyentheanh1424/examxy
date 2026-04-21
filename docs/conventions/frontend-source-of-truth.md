# Frontend Source of Truth

## Purpose
Canonical source of truth for where frontend design-system rules, shared UI contracts, and repo-specific UI ownership live.

## Applies when
- You change shared tokens, shared UI primitives, layout contracts, form behavior, or shared UI states.
- You are deciding whether a frontend change belongs in tokens, shared UI, or feature-local UI.
- You are reviewing a frontend change for design-system correctness and duplication risk.

## Current behavior / flow
- Detailed EDS v3.0 specifications live in `docs/conventions/design-system.md`.
- Agent implementation rules for that design system live in `AI_AGENT_PROJECT_GUIDE.md`.
- The real token source of truth in code lives in `examxy.client/src/styles/tokens.css` and `examxy.client/src/index.css`.
- Shared reusable primitives live in `examxy.client/src/components/ui/*`.
- Feature-specific UI lives under `examxy.client/src/features/*`.

## Invariants
- Do not create a parallel design system or ad-hoc styling when shared tokens and primitives already exist.
- Reuse shared UI primitives before adding feature-local copies of the same concept.
- Preserve 44px mobile touch targets, 16px mobile body text, Lucide-only icons, reduced motion support, and non-color-only status signals.
- Shared UI changes update code, tests, docs, and usage sites together.

## Change checklist
- Token change -> update token files, affected shared components, and the docs that describe the shared UI contract
- Shared UI contract change -> update component code, tests, usage sites, and `docs/conventions/design-system.md` if the design-system contract changed
- Feature-local UI that becomes shared -> promote it into `src/components/ui/*` and update this doc or the relevant frontend flow doc if ownership shifts

## Related
- `docs/conventions/design-system.md`
- `AI_AGENT_PROJECT_GUIDE.md`
- `examxy.client/src/styles/tokens.css`
- `examxy.client/src/index.css`
- `examxy.client/src/components/ui/*`

