---
name: quality-gate
description: Run the frontend quality gate — lint, typecheck, test, build — all four must pass before declaring any change complete.
---

# Frontend Quality Gate

Run the full frontend quality gate to verify correctness of any change.

## When to use

- After completing any frontend code change
- Before declaring a task complete
- Before committing or pushing changes

## Steps

Run all four commands in sequence from the `frontend/` directory. All must pass.

### 1. Lint

```bash
pnpm lint
```

Checks ESLint rules across all source files. Fix auto-fixable issues with:

```bash
pnpm lint --fix
```

### 2. Type check

```bash
pnpm typecheck
```

Runs the TypeScript compiler in check-only mode (`tsc --noEmit`). Catches type errors without producing output files.

### 3. Test

```bash
pnpm test
```

Runs the Vitest test suite. Includes coverage reporting.

Run a specific test file:

```bash
pnpm vitest run src/path/to/file.test.ts
```

### 4. Build

```bash
pnpm build
```

Produces the production bundle via Vite. Catches build-time errors, missing imports, and bundle issues.

## Passing criteria

All four steps must complete with exit code 0. If any step fails, fix the issues before declaring the task complete.

## Notes

- These commands run natively (no Docker needed) since the frontend repo has pnpm installed directly.
- The orchestrator's `make lint-frontend`, `make typecheck-frontend`, etc. targets run these same commands inside Docker — use this skill when working directly in the frontend repo.
- Coverage targets: 80% for utils/hooks, 70% for components.
