# Agent Rules — Dashy Kiosk

This file is read by all AI coding agents (Kimi Code, Claude Code, Qwen Code, Warp, etc.).
It contains **hard behavior rules**, not project background. For project knowledge, hardware details, architecture, and deployment history, see `README.md`.

## 1. pnpm Only (NON-NEGOTIABLE)

Use **pnpm** as the sole package manager for this project. Never use npm, yarn, or any other package manager.

### Forbidden

- `npm install`, `npm run`, `npx`
- `yarn`, `yarn install`
- Any package manager other than pnpm

### Approved

- `pnpm install`, `pnpm run`, `pnpm add`, `pnpm remove`
- `make` targets (which use pnpm internally)

## 2. Docker-first development (for orchestrated environments)

When running as part of the Dashy orchestrator, all commands run through docker compose. For standalone development, use pnpm directly.

### Approved commands

Use these `make` targets:

| Task | Command |
|------|---------|
| Install deps | `make install` |
| Add package | `make add PACKAGE=<name>` |
| Remove package | `make remove PACKAGE=<name>` |
| Lint | `make lint` |
| Format | `make format` |
| Type check | `make typecheck` |
| Run tests | `make test` |
| Build | `make build` |
| Dev server | `make dev` |

If a command you want is missing from the Makefile, add a target there — do not bypass it.

## 3. Verify before declaring done

For any frontend change:

1. `make lint`
2. `make typecheck`
3. `make test`
4. `make build`

All four must pass before you tell the user the task is complete.

## 4. Git workflow

- Work on the `development` branch. `main` is for stable releases.
- Do not run `git commit`, `git push`, `git reset`, `git rebase`, or other git mutations unless the user explicitly asks.
- Ask for confirmation before each git mutation, even if confirmed earlier in the conversation.
- Keep commits atomic and write messages that describe "why," not just "what."
- Include `Co-Authored-By: Oz <oz-agent@warp.dev>` in AI-assisted commits.

## 5. Frontend code standards

- **TypeScript required** — all new components must be `.tsx`. Avoid `any`; if unavoidable, add a comment explaining why.
- **One component per folder** — each component lives in its own folder under `src/features/` with `Component.tsx`, `Component.test.tsx`, and `index.ts` barrel export.
- **Every new component/hook needs tests** — at minimum a render test. Add tests as you build.
- **Reusable logic goes in `src/shared/hooks/`** — not inside components.
- **Shared types go in `src/types/`**.
- **No emojis in source or UI** — use SVG icons.

## 6. Architecture & design principles

- **Configurable, not hardcoded** — family members, colors, API keys, and similar data come from `.env` or config files.
- **Frontend-first for UI work** — build the UI with mock data, define the API contract, then build the backend to match.
- **Fluid full-viewport layout** — every feature must fill the visible window on any display. No page-level scrollbars, no hardcoded viewport assumptions, no `vw`/`clamp` sizing in components. See `README.md` for the detailed scaling model.
- **Floating layers** — popups/modals portal to `document.body` and apply the `useUiScale` factor to their content wrapper only.
- **Latest stable versions** — do not pin to old versions without a documented compatibility reason.

## 7. Code style

- Match the existing file's style, naming, and comment density.
- Minimal changes. No opportunistic refactors.
- ESLint and Prettier rules are enforced via pre-commit hooks; `make lint` must pass.
- No `console.log` except `console.warn`/`console.error`.

## 8. Universal coding standards

These standards apply to **all code** in the project. Every agent must follow them.

### Documentation

- **Every** public module, function, component, hook, and type must have proper documentation
- **TypeScript frontend:** JSDoc comments on exported functions, components, hooks, and types
- Private helpers get documentation when the logic is non-obvious
- Documentation is for humans — write it to be read, not to satisfy a linter

### Readable code

- Code is read far more often than it is written — optimize for readability
- Descriptive names over comments — if you need a comment to explain what code does, rename it
- Small, focused functions — one job per function
- No magic numbers or strings — use named constants
- Consistent patterns within a file and across the project

### Naming conventions

**TypeScript (frontend):**
- Files (components): `PascalCase.tsx` (e.g., `WeatherCard.tsx`)
- Files (hooks/utils): `camelCase.ts` (e.g., `useWeather.ts`)
- Components: `PascalCase` (e.g., `WeatherCard`)
- Functions/variables: `camelCase` (e.g., `getWeather()`)
- Types/interfaces: `PascalCase` (e.g., `WeatherResponse`)
- Constants: `UPPER_SNAKE_CASE` or `camelCase` (e.g., `MAX_RETRIES` or `apiUrl`)
- Directories: `camelCase/` or `kebab-case/` (e.g., `components/`, `hooks/`)

### Enforcement

- Linters and formatters enforce these automatically — `make lint` must pass
- Code review (human or agent) catches what linters miss
- All new code must comply; existing code upgraded during migration phases

## 9. Testing

- **Three-tier testing strategy:**
  1. **Unit tests** — domain logic, pure functions (fast, deterministic)
  2. **Component tests** — React Testing Library for component rendering and interaction
  3. **Integration tests** — full feature flows with mocked API
- **vitest** for test runner, **@testing-library/react** for component tests
- Tests live alongside components: `Component.test.tsx`
- All new features need tests before declaring done

## 10. When in doubt

If you are about to run a command and are unsure whether it violates the pnpm-only rule, stop and ask the user. It is better to confirm than to introduce the wrong package manager.
