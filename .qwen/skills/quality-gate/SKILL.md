---
name: quality-gate
description: Run the full Dashy quality gate — lint, typecheck, test, build — all four must pass before declaring any change complete.
---

# Quality Gate

Every code change in Dashy must pass all four steps before it can be considered done. No exceptions.

## Repository Structure

Dashy uses a multi-repo structure with submodules:
- **Orchestrator** (this repo): compose files, deployment scripts, docs
- **dashy-kiosk/**: dashy-kiosk submodule (React + TypeScript)
- **dashy-api/**: dashy-api submodule (FastAPI + Python)

Each submodule has its own quality-gate skill for standalone work. This skill runs the full gate across both.

## Steps (in order)

```bash
make lint
make typecheck
make test
make build
```

## Rules

1. **Run all four sequentially.** Do not skip any step. Do not parallelize them.
2. **Stop on first failure.** If `make lint` fails, fix lint errors before running typecheck. Do not pile up errors from multiple steps.
3. **Fix, don't suppress.** If a lint or typecheck error appears, fix the root cause. Do not add `@ts-ignore`, `# type: ignore`, or `eslint-disable` unless the user explicitly approves.
4. **Report results clearly.** After all four pass, confirm with the exact output. If any step fails, report the full error output — do not summarize or truncate.
5. **Docker-first.** All commands run through Makefile targets inside Docker containers. Never run `pnpm`, `npm`, `npx`, `uv`, `ruff`, `pytest`, or `tsc` directly on the host.

## What each step checks

| Step | Kiosk (dashy-kiosk) | API (dashy-api) |
|------|---------------------|-----------------|
| `make lint` | Oxlint (`pnpm run lint`) | Ruff check (`uv run ruff check app/ tests/`) |
| `make typecheck` | TypeScript (`pnpm run typecheck`) | N/A (Python uses runtime types) |
| `make test` | Vitest + Testing Library (jsdom) | pytest (`uv run pytest tests/ -v`) |
| `make build` | Vite production build | `uv run python -m compileall app/` |

**Note:** All API container commands use `uv run` prefix. Tests use an isolated `dashy_test` PostgreSQL database (not the dev database) — configured via `POSTGRES_*` env vars in `.env.test`.

## Working in Submodules

If you're working exclusively in one submodule, you can run its standalone quality-gate via Makefile targets:

**Kiosk only** (from orchestrator root):
```bash
make lint-kiosk
make typecheck-kiosk
make test-kiosk
make build-kiosk
```

**API only** (from orchestrator root):
```bash
make lint-api
make test-api
make build-api
```

**Note:** Always run the full orchestrator quality gate (`make lint && make typecheck && make test && make build`) before committing to the orchestrator, even if you've been using submodule-specific checks during development.

## After a change

If you made changes to both kiosk and API, all four steps still apply — the Makefile targets handle both. You do not need to run `lint-kiosk` and `lint-api` separately unless you want to isolate a failure.

## Granular checks (for faster feedback)

When working on only one side, you can run side-specific targets for faster iteration:

**API only:**
```bash
make lint-api
make test-api
```

**Kiosk only:**
```bash
make lint-kiosk
make typecheck-kiosk
make test-kiosk
```

**Note:** Always run the full quality gate (`make lint && make typecheck && make test && make build`) before committing or declaring work complete, even if you've been using granular checks during development.

## Common failure patterns

- **Lint failures after adding a component**: Missing barrel export (`index.ts`), unused imports, or `console.log` statements (use `console.warn`/`console.error` only)
- **Typecheck failures**: Type mismatch between kiosk `types/index.ts` and API `models.py` — the data models must stay in sync (see `sync-types` skill)
- **Test failures**: Kiosk tests use `vi.fn()` for mocks; API tests use `pytest.mark.asyncio` with `asyncio_mode = "auto"`
- **Build failures**: Kiosk build fails on TypeScript errors; API build fails on import errors or syntax issues
- **Submodule not committed**: If you changed files in `dashy-kiosk/` or `dashy-api/` but didn't commit in the submodule, the orchestrator won't see the changes. Use the `submodule-workflow` skill.

## Cross-Repo Coordination

When making API changes that affect both kiosk and API:

1. Update API models first
2. Update kiosk types to match
3. Run full quality gate from orchestrator
4. Commit in both submodules
5. Update orchestrator submodule refs
6. Run quality gate again from orchestrator to verify integration

See the `submodule-workflow` and `sync-types` skills for detailed guidance.
