# Frontend Source of Truth

## Purpose

Canonical source of truth for where frontend design-system rules, shared UI contracts, and repo-specific UI ownership live.

## Applies when

- You change shared tokens, shared UI primitives, layout contracts, form behavior, or shared UI states.
- You are deciding whether a frontend change belongs in tokens, shared UI, or feature-local UI.
- You are reviewing a frontend change for design-system correctness and duplication risk.

## Current behavior / flow

- Detailed EDS v3.0 specifications start at `docs/conventions/INDEX.md`, which routes into the numbered design-system docs by concern.
- Use `docs/conventions/01-tokens-colors.md` and `02-tokens-typography-spacing.md` for tokens, `03-layout-breakpoints.md` and `09-components-layout.md` for layout, `05-components-button-input.md` through `08-components-feedback.md` for shared UI primitives, `10-forms-validation.md` for form behavior, `11-dark-mode.md` for dark mode, `12-accessibility.md` for accessibility, and `13-copywriting.md` for UI copy.
- Agent implementation rules for that design system live in `AI_AGENT_PROJECT_GUIDE.md`.
- The real token source of truth in code lives in `examxy.client/src/styles/tokens.css` and `examxy.client/src/index.css`.
- Shared reusable primitives live in `examxy.client/src/components/ui/*`.
- `examxy.client/src/components/ui/*` is the only supported public surface for shared frontend UI. Do not keep staging, mirror, or reference-only component trees under `src/components/ui/components/*`.
- Feature-specific UI lives under `examxy.client/src/features/*`.

## Invariants

- Do not create a parallel design system or ad-hoc styling when shared tokens and primitives already exist.
- Reuse shared UI primitives before adding feature-local copies of the same concept.
- If reference/mockup UI is imported for exploration, absorb it into `src/components/ui/*` or discard it; do not leave it compiling beside the real shared layer.
- Preserve 44px mobile touch targets, 16px mobile body text, Lucide-only icons, reduced motion support, and non-color-only status signals.
- Shared UI changes update code, tests, docs, and usage sites together.

## Figma/tmp UI Migration Rules

- `examxy.client/src/features/*` is the behavior source of truth for real frontend pages.
- `examxy.client/src/tmp` is Figma-generated reference UI only.
- `examxy.client/src/components/ui/*` is the shared UI source of truth.
- Real application code must not import from `examxy.client/src/tmp`.
- Prototype `components/eds` and prototype `AppShell` must not be revived in real runtime code.
- Migrate layout, interaction patterns, visual hierarchy, empty/loading state ideas, and preview/detail organization.
- Do not migrate mock data, fake API behavior, prototype routing, or unsupported feature behavior.
- If a `src/tmp` pattern requires data that the real API does not currently provide, document it as an API gap or backlog item instead of faking runtime data.
- Existing API, auth, realtime, permission, error, route, and test behavior must remain intact unless the owning backend/API docs explicitly change.

## Change checklist

- Token change -> update token files, affected shared components, and the docs that describe the shared UI contract
- Shared UI contract change -> update component code, tests, usage sites, and the relevant file under `docs/conventions/INDEX.md` if the design-system contract changed
- Feature-local UI that becomes shared -> promote it into `src/components/ui/*` and update this doc or the relevant frontend flow doc if ownership shifts

## Related

- `docs/conventions/INDEX.md`
- `docs/conventions/01-tokens-colors.md`
- `docs/conventions/02-tokens-typography-spacing.md`
- `docs/conventions/03-layout-breakpoints.md`
- `docs/conventions/05-components-button-input.md`
- `docs/conventions/06-components-data-display.md`
- `docs/conventions/07-components-overlay.md`
- `docs/conventions/08-components-feedback.md`
- `docs/conventions/09-components-layout.md`
- `docs/conventions/10-forms-validation.md`
- `docs/conventions/11-dark-mode.md`
- `docs/conventions/12-accessibility.md`
- `docs/conventions/13-copywriting.md`
- `AI_AGENT_PROJECT_GUIDE.md`
- `examxy.client/src/styles/tokens.css`
- `examxy.client/src/index.css`
- `examxy.client/src/components/ui/*`
