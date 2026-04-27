# examxy.client

## Scope
React/Vite frontend: shared UI primitives, app routing, client auth/session, API client behavior, and feature pages.

## When you are here
- You are changing UI, routes, auth/session behavior, API client mapping, or frontend feature flows.
- You are updating shared tokens, shared UI primitives, or feature pages in `src/features/*`.
- Do not change backend auth policy, EF Core persistence, server middleware, or migration logic here.

## Read before changing
- Shared UI, tokens, layout, form, or table behavior -> `../docs/conventions/frontend-source-of-truth.md`, `../docs/conventions/INDEX.md`
- Use `../docs/conventions/INDEX.md` as the design-system entrypoint, then load the relevant file: `01-tokens-colors.md` for color tokens, `02-tokens-typography-spacing.md` for spacing/type, `03-layout-breakpoints.md` and `09-components-layout.md` for layout, `05-components-button-input.md` to `08-components-feedback.md` for shared primitives, `10-forms-validation.md` for forms, `11-dark-mode.md` for dark mode, `12-accessibility.md` for a11y, and `13-copywriting.md` for UI copy.
- Auth/session, route guard, query-string token flow -> `../docs/features/client-authentication.md`
- Class dashboard UX, role visibility, or state flow -> `../docs/features/frontend-flow-class-dashboard.md`
- API error rendering or field error mapping -> `../docs/features/error-handling.md`

## Rules
- Reuse `src/components/ui/*` and `src/styles/tokens.css` before adding new UI patterns.
- Do not hard-code colors, spacing, typography, motion, radius, or shadow when a shared token exists.
- Preserve mobile 44px hit targets, 16px body text, Lucide icons, reduced motion, and non-color-only status signals.
- Keep client auth behavior aligned with backend auth and error-contract docs.
- Shared UI changes must update usage sites, tests, and the canonical docs they depend on.

## Verify
- `npm run lint`
- `npm run test:run`
- `npm run build`

## Update docs when
- Auth/session or route behavior changes -> `../docs/features/client-authentication.md`
- Dashboard UX or role/state flow changes -> `../docs/features/frontend-flow-class-dashboard.md`
- Shared UI or design-system contract changes -> `../docs/conventions/frontend-source-of-truth.md`, `../docs/conventions/INDEX.md`, `../AI_AGENT_PROJECT_GUIDE.md`
- Shared error rendering changes -> `../docs/features/error-handling.md`

## Review focus
- Shared UI regression and accidental pattern duplication
- Session persistence, refresh-on-401, and query-string token flows
- Role-based routing and API error mapping drift
