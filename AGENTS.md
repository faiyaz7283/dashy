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

### Environment Files

**All `.env` files live in the `env/` directory at the orchestrator root:**

| File | Purpose |
|------|---------|
| `env/.env.dev` | Development environment variables (API keys, mock toggles, family members) |
| `env/.env.test` | Test environment variables (isolated test database) |
| `env/.env.dev.example` | Template for `.env.dev` (safe to commit) |
| `env/.env.test.example` | Template for `.env.test` (safe to commit) |

**Never search for `.env` files in submodules or other locations.** The compose files reference `../env/.env.dev` and `../env/.env.test` explicitly.

**Mock data toggles** (in `env/.env.dev`):
- `WEATHER_USE_MOCK=true` — Use mock weather data (API rate limit protection)
- `CALENDAR_USE_MOCK=true` — Use mock calendar data (API rate limit protection)
- `CHORES_USE_MOCK=false` — Use real chores data from local database (no rate limit concerns)

**After changing `.env.dev`, restart the API container** to pick up new values:
```bash
cd /Users/admin/dashy && docker compose -f compose/docker-compose.dev-v2.yml restart api
```

## 2. Docker-first development (NON-NEGOTIABLE)

Dashy is a Dockerized project. **Never run development tools directly on the host machine.** All package management, linting, type-checking, testing, formatting, and execution must happen inside Docker containers via Makefile targets or `docker compose exec`.

### Forbidden on the host

Never run these directly on the local machine, even if they appear to "work":

**Frontend tools:**
- `pnpm`, `npm`, `yarn`, `node`, `npx`

**Backend tools:**
- `uv` (except `uv` itself as a system tool; never `uv pip install`, `uv run`, `uv sync` against the local filesystem)
- `pip`, `pip3`, `python`, `python3`
- `ruff`, `pytest`, `mypy`

**One-off commands:** Use `docker compose exec` or add a Makefile target. Never develop or test locally unless there's a documented edge case.

### Approved commands

Use these `make` targets (all run inside containers):

| Task | Command |
|------|---------|
| **Setup & Sync** | |
| First-time setup | `make setup` |
| Sync all repos + submodules | `make sync` |
| Update submodule refs | `make submodule-update` |
| **Development Environment** | |
| Start dev environment | `make dev-up` |
| Stop dev environment | `make dev-down` |
| View dev logs | `make dev-logs` |
| Shell into API container | `make dev-shell` |
| Shell into kiosk container | `make dev-shell-kiosk` |
| Restart dev environment | `make dev-restart` |
| Build dev containers | `make dev-build` |
| Rebuild dev containers (no cache) | `make dev-rebuild` |
| **Package Management** | |
| Install kiosk deps | `make install-kiosk` |
| Install API deps | `make install-api` |
| Add kiosk package | `make add-kiosk PACKAGE=<name>` |
| Add kiosk dev package | `make add-kiosk-dev PACKAGE=<name>` |
| Add API package | `make add-api PACKAGE=<name>` |
| Remove kiosk package | `make remove-kiosk PACKAGE=<name>` |
| Remove kiosk dev package | `make remove-kiosk-dev PACKAGE=<name>` |
| Remove API package | `make remove-api PACKAGE=<name>` |
| Fix pnpm store mismatch | `make fix-kiosk-store` |
| Generate API lockfile | `make lock-api` |
| **Code Quality** | |
| Lint everything | `make lint` |
| Lint kiosk only | `make lint-kiosk` |
| Lint API only | `make lint-api` |
| Format everything | `make format` |
| Format kiosk only | `make format-kiosk` |
| Format API only | `make format-api` |
| Type check kiosk | `make typecheck` / `make typecheck-kiosk` |
| **Testing** | |
| Run all tests | `make test` |
| Run kiosk tests | `make test-kiosk` |
| Run API tests | `make test-api` |
| **Database Migrations** | |
| Run pending migrations | `make migrate` |
| Show migration state | `make migrate-status` |
| Check models vs migrations | `make migrate-check` |
| Rollback last migration | `make migrate-rollback` |
| Create new migration | `make migrate-create MESSAGE=<msg>` |
| **Build** | |
| Production build (both) | `make build` |
| Production build kiosk | `make build-kiosk` |
| Production build API | `make build-api` |
| **Deployment** | |
| Deploy to Pi (production) | `make deploy-pi` |
| Check deploy status | `make deploy-status` |
| View deploy logs | `make deploy-logs` |
| Stop Pi deployment | `make deploy-down` |
| Restart Pi deployment | `make deploy-restart` |
| **Utilities** | |
| Clean all environments | `make clean` |

If a command you want is missing from the Makefile, add a target there — do not bypass it.

## 3. Verify before declaring done

For any kiosk or API change:

1. `make lint`
2. `make typecheck`
3. `make test`
4. `make build`

All four must pass before you tell the user the task is complete.

**Test isolation:** API tests use a separate `test.db` database (not the dev `dashy.db`). This is configured via `DATABASE_URL` set before imports in `tests/conftest.py`. Tests never modify the development database.

## 4. Git workflow

- Work on the `development` branch. `main` is for stable releases.
- Do not run `git commit`, `git push`, `git reset`, `git rebase`, or other git mutations unless the user explicitly asks.
- Ask for confirmation before each git mutation, even if confirmed earlier in the conversation.
- Keep commits atomic and write messages that describe "why," not just "what."
- Include `Co-Authored-By: Qwen <noreply@qwen.ai>` in AI-assisted commits.

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
- **Frontend:** ESLint + Prettier enforced via `make lint` / `make format`.
- **Backend:** Ruff enforced via `make lint` / `make format`.
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

- Use the `deploy-production` skill for full production deploys — it handles quality gates, CI checks, submodule commits, merge to main, and Pi deployment in one flow.
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

## 9. Cross-repo feature orchestration

When a feature touches multiple repos (orchestrator + kiosk + api), use the **plan → delegate → integrate** pattern:

1. **Plan at orchestrator level** — break the feature into per-repo tasks with dependencies and ordering
2. **Delegate submodule work to subagents** — use the `agent` tool with `working_dir` pointed at the submodule (`dashy-kiosk/` or `dashy-api/`). Subagents inherit the submodule's `.qwen/skills/` and code conventions automatically
3. **Integrate at orchestrator level** — the main agent handles cross-cutting concerns: orchestrator-level changes (compose, Makefile, env), submodule ref updates, quality gates, and deployment

### Rules

- **Never delegate planning** — the main agent owns the plan and presents it to the user for approval before any delegation
- **Subagents are scoped** — each subagent works in exactly one repo. Do not give a subagent cross-repo tasks
- **Subagents get explicit prompts** — include the file paths, constraints, and what "done" looks like. Do not write vague prompts like "implement the feature"
- **Main agent verifies** — after subagents complete, the main agent runs `make lint`, `make typecheck`, `make test`, `make build` from the orchestrator
- **User stays in one session** — the user interacts only with the main orchestrator session. Subagents are invisible implementation detail

### When NOT to delegate

- Single-repo changes (e.g., only frontend) — just do it directly, no need for subagent overhead
- Orchestrator-only changes (compose, Makefile, deploy scripts) — handle in main session
- Quick fixes or bug fixes that touch one file — just fix it

## 10. Database & migrations

Dashy uses SQLite with Alembic for schema migrations. The database architecture is designed for isolation and persistence.

### Migration automation

- **`make dev-up`** runs `alembic upgrade head` automatically via `entrypoint.sh` — no manual step needed
- **`make sync`** also applies pending migrations if the dev environment is already running
- Migrations are idempotent — running `make migrate` multiple times is safe

### Manual migration commands

| Command | Purpose |
|---------|---------|
| `make migrate` | Run pending migrations without restart |
| `make migrate-status` | Show current version + full history |
| `make migrate-check` | Verify models match migrations (catch forgotten migrations) |
| `make migrate-rollback` | Rollback last migration (`downgrade -1`) |
| `make migrate-create MESSAGE="..."` | Generate new migration from model changes |

### Workflow when adding a new model

1. Edit SQLModel classes in `dashy-api/app/domain/.../models.py`
2. Run `make migrate-create MESSAGE="add new_table"`
3. Review generated migration in `dashy-api/alembic/versions/`
4. Run `make migrate` to apply it
5. Commit the migration file with your model changes

### Database architecture

- **Dev database:** SQLite at `/app/data/dashy.db` on Docker volume `api-data` (persists across restarts)
- **Production database:** Separate SQLite file on Pi's Docker volume (persists independently)
- **Test database:** Isolated `test.db` created by `tests/conftest.py` (never touches dev data)
- **Not git-tracked:** `.gitignore` excludes `*.db` — database files never enter version control

### uv run pattern

All commands executed inside the API container must use `uv run` prefix:
- `uv run pytest tests/ -v` (not `pytest`)
- `uv run ruff check app/` (not `ruff check`)
- `uv run alembic upgrade head` (not `alembic upgrade head`)
- `uv run python -c "..."` (not `python -c "..."`)

This ensures the correct Python environment and dependencies are used.

## 11. When in doubt

If you are about to run a command and are unsure whether it violates the Docker-first rule, stop and ask the user. It is better to confirm than to pollute the working tree.
