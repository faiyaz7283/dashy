---
name: quality-gate
description: Run the full Dashy quality gate — lint, typecheck, test, build — all four must pass before declaring any change complete.
---

# Quality Gate

Every code change in Dashy must pass all four steps before it can be considered done. No exceptions.

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
5. **Docker-first.** All commands run through Makefile targets inside Docker containers. Never run `npm`, `npx`, `uv`, `ruff`, `pytest`, or `tsc` directly on the host.

## What each step checks

| Step | Frontend | Backend |
|------|----------|---------|
| `make lint` | ESLint (`npm run lint`) | Ruff check (`ruff check app/ tests/`) |
| `make typecheck` | TypeScript (`npm run typecheck`) | N/A (Python uses runtime types) |
| `make test` | Vitest + Testing Library (jsdom) | pytest + pytest-asyncio |
| `make build` | Vite production build | `python -m compileall app/` |

## After a change

If you made changes to both frontend and backend, all four steps still apply — the Makefile targets handle both. You do not need to run `lint-frontend` and `lint-backend` separately unless you want to isolate a failure.

## Common failure patterns

- **Lint failures after adding a component**: Missing barrel export (`index.ts`), unused imports, or `console.log` statements (use `console.warn`/`console.error` only)
- **Typecheck failures**: Type mismatch between frontend `types/index.ts` and backend `models.py` — the data models must stay in sync
- **Test failures**: Frontend tests use `vi.fn()` for mocks; backend tests use `pytest.mark.asyncio` with `asyncio_mode = "auto"`
- **Build failures**: Frontend build fails on TypeScript errors; backend build fails on import errors or syntax issues
