# Kimi Code — Dashy

This project's actual rules live in the root `AGENTS.md` — read that first. It
covers Docker-first development (non-negotiable), verify-before-declaring-done,
git/submodule workflow, architecture principles, and MCP server policy.

This file exists only because Kimi Code's native project scope is
`.kimi-code/`. It intentionally does not duplicate root `AGENTS.md` content —
duplicating it here would drift out of sync the next time root `AGENTS.md`
changes.

## Skills

Project skills are discovered from `.agents/skills/` (Kimi Code's documented
project-level Agent Skills location) — there is no separate
`.kimi-code/skills/` copy, to avoid one shadowing edits made to the other.
See `.agents/skills/skill-library/SKILL.md` for the DAILY vs LIBRARY map.

## MCP

See root `AGENTS.md` section 12. This project's `.kimi-code/mcp.json` mirrors
that policy — only `github` and `context7` are enabled today.
