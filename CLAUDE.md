## Repository Workflow

- Start with `docs/README.md`, then read `docs/ai/onboarding.md`, `docs/architecture/solution-map.md`, `docs/context/current-state.md`, and the canonical task doc before changing repo-tracked files.
- Treat root `AGENTS.md` as the monorepo routing source of truth and defer module-local rules to the closest child `AGENTS.md`.
- Present an execution plan first and wait for explicit user approval before making code changes, running write actions, or otherwise executing the task.
- Use GitNexus first for code understanding and safety checks: repo context/check staleness, `query` and `context` for exploration, `impact` before editing symbols, and `detect_changes` before commit.
- Refresh GitNexus on Windows with `npx.cmd gitnexus@1.6.4-rc.7 analyze --force`; `gitnexus@latest` currently fails this repo on analyzer `1.6.3`.
- Use grep, file search, and direct source inspection only as follow-up once GitNexus has narrowed the area or when implementation details are not represented in the graph.

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **examxy** (8140 symbols, 17924 relationships, 300 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

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
