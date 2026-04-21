# Repository Root

## Scope
Monorepo-wide routing for docs, module boundaries, shared validation, and cross-module review risk.

## When you are here
- You are scoping a task from repo root or touching more than one top-level module.
- You need to choose which module owns a change or which docs are canonical.
- Do not keep frontend-only, persistence-only, or feature-specific rules here; use the closest child `AGENTS.md`.

## Read before changing
- Cross-module or boundary change -> `docs/architecture/solution-map.md`
- Current shipped capability or constraint -> `docs/context/current-state.md`
- Auth, token, or API error change -> `docs/features/authentication.md`, `docs/features/error-handling.md`, `docs/features/api-flow-authentication.md`
- Frontend auth/session change -> `docs/features/client-authentication.md`
- Shared UI or design-system change -> `docs/conventions/frontend-source-of-truth.md`, `docs/conventions/design-system.md`
- Class foundation, content, assessment, or question-bank change -> `docs/features/README.md` and the relevant feature doc
- Migration, local tooling, or seed script change -> `docs/runbooks/local-development.md`, `docs/lessons/2026-03-31-migration-script-lessons.md`

## Rules
- Treat `examxy.Server` as the runtime startup host.
- Preserve the real dependency direction: Server -> Application/Infrastructure, Infrastructure -> Application/Domain, Application -> Domain.
- Keep one canonical doc per concept; `AGENTS.md` routes to docs and does not redefine them.
- Update tests, contracts, and docs whenever behavior, API shape, config contract, or migration behavior changes.
- If a recurring agent mistake is local to one module, fix the closest child `AGENTS.md` instead of expanding root guidance.

## Verify
- Backend build: `dotnet build .\examxy.Server\examxy.Server.csproj`
- Integration/API regression: `dotnet test .\test.Integration\test.Integration.csproj`
- Frontend regression: in `examxy.client`, run `npm run lint`, `npm run test:run`, `npm run build`

## Update docs when
- Architecture or ownership changes -> `docs/architecture/solution-map.md`, `docs/context/current-state.md`
- Auth, API error, or token behavior changes -> `docs/features/authentication.md`, `docs/features/error-handling.md`, related `docs/features/api-flow-*.md`
- Local setup or migration behavior changes -> `docs/runbooks/local-development.md`
- Codex workflow or doc routing changes -> `docs/ai/onboarding.md`, `docs/conventions/documentation-rules.md`

## Review focus
- Cross-layer leakage and wrong ownership
- API contract drift between Server, Application, Infrastructure, and client
- High-risk regressions in auth, persistence/migrations, OpenAPI, and shared UI
