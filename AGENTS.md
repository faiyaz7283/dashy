# Agent Rules — Dashy (Orchestrator)

This file is read by all AI coding agents (Kimi Code, Claude Code, Qwen Code, Warp, etc.).
It contains **hard behavior rules**, not project background. For project knowledge, hardware details, architecture, and deployment history, see `README.md`.

## 1. Repository Structure

Dashy is an **orchestrator repo** with git submodules:

- `dashy-kiosk/` → `dashy-kiosk` (React + Vite + TypeScript)
- `dashy-api/` → `dashy-api` (FastAPI + Python)

**Code standards for each submodule live in their own repos:**
- Frontend: `dashy-kiosk/AGENTS.md` (TypeScript, pnpm, TSDoc, testing)
- Backend: `dashy-api/AGENTS.md` (Python, UV, Google docstrings, testing)

**This file covers orchestrator-specific rules only.**

## 2. Docker-first development (NON-NEGOTIABLE)

Dashy is a Dockerized project. **Every** package-management, linting, type-checking, testing, and formatting command must run through `make` commands that execute inside the development containers.

### Forbidden on the host

Never run these directly on the local machine, even if they appear to "work" or the container command fails:

- `npm`, `npx`, `pnpm`, `yarn`, `node`
- `uv` (except `uv` itself as a system tool; never `uv pip install`, `uv run`, `uv sync` against the local filesystem)
- `pip`, `pip3`, `python`, `python3`
- `ruff`, `pytest`, `mypy`
- Ad-hoc `docker compose exec ...` should only be used inside the provided Makefile targets

### Approved commands

Use these `make` targets instead:

| Task | Command |
|------|---------|
| Install frontend deps | `make install-frontend` |
| Install backend deps | `make install-backend` |
| Add frontend package | `make add-frontend PACKAGE=<name>` |
| Add backend package | `make add-backend PACKAGE=<name>` |
| Remove frontend package | `make remove-frontend PACKAGE=<name>` |
| Remove backend package | `make remove-backend PACKAGE=<name>` |
| Lint everything | `make lint` |
| Lint frontend only | `make lint-frontend` |
| Lint backend only | `make lint-backend` |
| Format everything | `make format` |
| Type check frontend | `make typecheck` / `make typecheck-frontend` |
| Run all tests | `make test` |
| Run frontend tests | `make test-frontend` |
| Run backend tests | `make test-backend` |
| Production build | `make build` |
| Start dev environment | `make dev-up` |
| Update submodules | `make submodule-update` |

If a command you want is missing from the Makefile, add a target there — do not bypass it.

## 3. Verify before declaring done

For any frontend or backend change:

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

### Submodule workflow

When making changes to frontend or backend:

1. **Work inside the submodule** — `cd dashy-kiosk/` or `cd dashy-api/`
2. **Commit in the submodule first** — submodule repos have their own git history
3. **Update the submodule ref in the orchestrator** — `make submodule-update` or manually `git add dashy-kiosk/ dashy-api/`
4. **Commit the orchestrator** — this records which submodule commits are pinned

**Never commit submodule changes without updating the orchestrator's submodule refs.**

## 5. Architecture & design principles

- **Configurable, not hardcoded** — family members, colors, API keys, and similar data come from `.env` or config files.
- **Frontend-first for UI work** — build the UI with mock data, define the API contract, then build the backend to match.
- **Fluid full-viewport layout** — every feature must fill the visible window on any display. No page-level scrollbars, no hardcoded viewport assumptions, no `vw`/`clamp` sizing in components. See `README.md` for the detailed scaling model.
- **Floating layers** — popups/modals portal to `document.body` and apply the `useUiScale` factor to their content wrapper only.
- **Latest stable versions** — do not pin to old versions without a documented compatibility reason.
- **Update `README.md`** whenever conventions, structure, hardware, or deployment status change.

## 6. Code style

- Match the existing file's style, naming, and comment density.
- Minimal changes. No opportunistic refactors.
- ESLint and Prettier rules are enforced via pre-commit hooks; `make lint` must pass.
- No `console.log` except `console.warn`/`console.error`.

## 7. Universal coding standards

These standards apply to **all code** in the project, regardless of language or framework. Every agent must follow them.

### Documentation

- **Every** public module, class, function, and method must have proper documentation
- **Python backend:** Google-style docstrings (enforced via ruff `pydocstyle` with `convention = "google"`)
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

**Python (backend):**
- Files/modules: `snake_case.py` (e.g., `weather_service.py`)
- Classes: `PascalCase` (e.g., `WeatherProvider`)
- Functions/methods: `snake_case` (e.g., `get_weather()`)
- Variables: `snake_case` (e.g., `api_key`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_RETRIES`)
- Private members: `_prefixed` (e.g., `_fetch_internal()`)
- Directories: `snake_case/` (e.g., `domain/weather/`)

**TypeScript (frontend):**
- Files (components): `PascalCase.tsx` (e.g., `WeatherCard.tsx`)
- Files (hooks/utils): `camelCase.ts` (e.g., `useWeather.ts`)
- Components: `PascalCase` (e.g., `WeatherCard`)
- Functions/variables: `camelCase` (e.g., `getWeather()`)
- Types/interfaces: `PascalCase` (e.g., `WeatherResponse`)
- Constants: `UPPER_SNAKE_CASE` or `camelCase` (e.g., `MAX_RETRIES` or `apiUrl`)
- Directories: `camelCase/` or `kebab-case/` (e.g., `components/`, `hooks/`)

**General rules (all languages):**
- **Files:** Names should describe what's in them — `weather_service.py` not `svc.py`
- **Directories:** Group by domain/concern — `domain/weather/` not `stuff/`
- **Functions:** Verb + noun — `fetch_weather()`, `parse_event()`, `convert_temperature()`
- **Booleans:** Prefix with `is_`, `has_`, `should_`, `can_` — `is_valid`, `has_error`
- **Collections:** Pluralize — `members`, `events`, `daily_forecasts`
- **No abbreviations** unless universally understood (`id`, `url`, `api`, `tz`)
- **No single-letter variables** except loop indices (`i`, `j`) or math (`x`, `y`)

### Enforcement

- Linters and formatters enforce these automatically — `make lint` must pass
- Code review (human or agent) catches what linters miss
- All new code must comply; existing code upgraded during migration phases

## 8. Deployment flow

- Normal production deploy: commit to `main`, push, let GitHub Actions deploy.
- Manual Pi deploy only when explicitly requested: `make deploy-pi`.
- Do not run `docker compose` directly on the Pi unless the Makefile target does so for you.
- Do not deploy if CI is failing on `main`.

### Submodule deployment

When deploying with submodule changes:

1. **Commit in submodules first** — `cd dashy-kiosk/ && git add . && git commit`
2. **Push submodule changes** — `cd dashy-kiosk/ && git push origin development`
3. **Update orchestrator refs** — `make submodule-update`
4. **Commit orchestrator** — `git add dashy-kiosk/ dashy-api/ && git commit`
5. **Push orchestrator** — `git push origin development`
6. **Deploy** — `make deploy-pi` (pulls latest submodule commits automatically)

## 9. When in doubt

If you are about to run a command and are unsure whether it violates the Docker-first rule, stop and ask the user. It is better to confirm than to pollute the working tree.
