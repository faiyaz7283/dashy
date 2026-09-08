---
name: skill-library
description: Router for ECC's LIBRARY-bucket skills that are not loaded by default in this project. Use when a task needs security review, deployment patterns, accessibility, or any off-stack ECC skill that isn't part of dashy's DAILY set.
metadata:
  origin: project
---

# Skill Library (Dashy)

Dashy loads a small **DAILY** set of skills every session (see below). Everything
else in ECC's catalog is **LIBRARY**: real, useful, but not worth the context cost
of loading by default. This file is the router between the two.

If a task matches a keyword group below, explicitly invoke that ECC skill by name
instead of waiting for it to auto-load — it won't.

## DAILY (already active every session)

These are installed and load automatically. Don't route to them here.

- `python-patterns`, `fastapi-patterns`, `python-testing` — dashy-api (FastAPI, pytest)
- `postgres-patterns`, `redis-patterns`, `database-migrations` — Postgres + Redis + Alembic
- `react-patterns`, `react-testing`, `vite-patterns` — dashy-kiosk (React 19, Vite, Vitest)
- `api-design`, `git-workflow`, `tdd-workflow` — cross-cutting
- Dashy's own custom skills in `.agents/skills/`: `dashy-docker-ops`, `dev-env`,
  `makefile-patterns`, `quality-gate`, `submodule-workflow`, `sync-types`,
  `testing-patterns`, `add-docker-service`, `check-ci`, `deploy-production`,
  `deploy-pi`, `verify-local` — these encode Dashy-specific conventions the
  generic ECC skills don't know about; always prefer these over an ECC generic
  when both exist for the same topic.

## LIBRARY (invoke by name when the task calls for it)

| Trigger keywords | Skill to invoke |
|---|---|
| auth, secrets, injection, OWASP, PII, credential handling | `security-reviewer` (agent) / `security-review` (skill) |
| production deploy pipeline, rollout strategy, blue-green, canary | `deployment-patterns` |
| screen reader, keyboard nav, WCAG, contrast, ARIA | `accessibility` |
| API/event schema shared by kiosk + api, contract drift between consumers | `contract-first` — read this before extending `sync-types`; it covers the general pattern dashy's custom skill was solving ad hoc |
| "am I actually done", stop-hook style completion gate | `verification-loop`, `delivery-gate` |
| dead code, unused deps, cleanup pass | `refactor-clean` |
| performance profiling, slow endpoint, bundle size | `performance-optimizer` |
| non-Python/TS work (Go, Rust, Java, Kotlin, Swift, Flutter, PHP, etc.) | matching `<language>-patterns` / `<language>-reviewer` — off-stack for dashy today |
| domain-specific (healthcare, homelab, defi, ML training, scientific) | not relevant to dashy; skip |

## Resolution

ECC skills referenced above live in the ECC catalog (installed skill directory
or `~/ECC/skills/<name>/SKILL.md` if running from a cloned checkout). If a
skill listed here isn't installed in this project yet, install it explicitly
rather than pulling in a full profile:

```bash
./install.sh --target claude-project --skills <skill-id>
```

## Maintenance

When Dashy's DAILY list changes (new framework, dropped dependency), update
this file and the actual install alongside it — this router is a map of what's
installed, not a wishlist.
