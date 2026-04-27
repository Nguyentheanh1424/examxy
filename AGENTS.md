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
- Shared UI or design-system change -> `docs/conventions/frontend-source-of-truth.md`, `docs/conventions/INDEX.md`
- Class foundation, content, assessment, or question-bank change -> `docs/features/README.md` and the relevant feature doc
- Migration, local tooling, or seed script change -> `docs/runbooks/local-development.md`, `docs/lessons/2026-03-31-migration-script-lessons.md`

## Rules
- Treat `examxy.Server` as the runtime startup host.
- Preserve the real dependency direction: Server -> Application/Infrastructure, Infrastructure -> Application/Domain, Application -> Domain.
- Keep one canonical doc per concept; `AGENTS.md` routes to docs and does not redefine them.
- For every future task, the agent must present an execution plan first and wait for explicit user approval before making code changes, running write actions, or otherwise executing the task.
- Work docs-first: start from `docs/README.md`, then read the canonical architecture, context, feature, or runbook doc for the task before changing repo-tracked files.
- Work GitNexus-first for code understanding and safety checks: use repo context/check staleness first, then `query`/`context` for exploration, `impact` before editing symbols, and `detect_changes` before commit.
- When refreshing GitNexus on Windows, use `npx.cmd gitnexus@1.6.4-rc.7 analyze --force`; `gitnexus@latest` currently fails this repo on analyzer `1.6.3`.
- Fall back to grep, file search, and direct source inspection only after GitNexus narrows the area or when implementation details are missing from the graph.
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

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **examxy** (6133 symbols, 13486 relationships, 300 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/examxy/context` | Codebase overview, check index freshness |
| `gitnexus://repo/examxy/clusters` | All functional areas |
| `gitnexus://repo/examxy/processes` | All execution flows |
| `gitnexus://repo/examxy/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
