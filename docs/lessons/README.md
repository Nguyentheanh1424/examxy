# Lessons Learned

This directory is used to record lessons learned after encountering bugs, blockers, or time-consuming fixes.

## Purpose

- Quickly recognize previously seen symptoms
- Reduce the need to debug from scratch
- Provide AI with real repository context, not just high-level architecture
- Turn past issues into prevention checklists

## When to create a new note

- A bug takes significant time to identify the root cause
- Confusion related to startup project, config, host, migration, environment, testing, or build
- Issues caused by scripts, tooling, or processes
- Issues likely to recur if not documented

## Each note should include

- symptom
- root cause
- fix
- verify
- prevention
- files or commands to check first

## File naming convention

`yyyy-mm-dd-short-topic.md`

Examples:

- `2026-03-31-migration-script-lessons.md`
- `2026-04-02-auth-token-debug-notes.md`

## Notes for AI

- If the current task is a bug fix, read the `lessons/` directory before starting debugging.
- After fixing, update an existing note if it shares the same root cause. Only create a new file if it represents a distinct lesson.

## Existing notes

- [2026-03-31-migration-script-lessons.md](2026-03-31-migration-script-lessons.md)
- [2026-04-01-global-exception-handling-and-model-validation.md](2026-04-01-global-exception-handling-and-model-validation.md)
- [2026-04-06-auth-email-smtp-and-token-debugging.md](2026-04-06-auth-email-smtp-and-token-debugging.md)
