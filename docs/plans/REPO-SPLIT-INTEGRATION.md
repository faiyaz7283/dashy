# Repo Split & Integration Plan

> Status: **DRAFT — awaiting review**
> Created: 2026-08-16
> Last updated: 2026-08-17
> Scope: Convert the `dashy` monorepo into an orchestrator repo with `dashy-kiosk` (frontend) and `dashy-api` (backend) as git submodules, following the proven dashtam pattern.

### Implementation Status (as of 2026-08-17)

All phases are **planned** — no implementation has started yet. Depends on both frontend migration (F1-F7) and backend migration (B1-B7) being complete.

| Phase | Status | Summary |
|-------|--------|---------|
| S1: Create Submodule Repos | 🔲 Not started | Create `dashy-api` and `dashy-kiosk` repos, move code |
| S2: Convert to Orchestrator | 🔲 Not started | Add `.gitmodules`, remove source dirs, update references |
| S3: Update CI | 🔲 Not started | Submodule CI + orchestrator CI (compose validation) |
| S4: Update Compose & Deploy | 🔲 Not started | Compose files reference submodule paths, update `make deploy-pi` |
| S5: Update Skills & Docs | 🔲 Not started | AGENTS.md, README.md, `.qwen/skills/` in all repos |
| S6: Deploy to Pi | 🔲 Not started | Clone submodules on Pi, verify two-repo deploy |

---

## Rationale

After the frontend and backend migrations are complete, the codebases will have diverged significantly in structure and concerns. Splitting into separate repos provides:

- **Independent deployment** — frontend and backend can be deployed separately
- **Independent CI** — each repo has its own lint/test/build pipeline
- **Clear ownership** — frontend conventions in one repo, backend in another
- **Smaller context** — agents working on one side don't need to load the other
- **Separate versioning** — API breaking changes don't force frontend releases

**Why orchestrator + submodules (not two independent repos):**

The dashtam project already uses this pattern successfully. An orchestrator repo keeps compose files, deployment scripts, docs, and kiosk config in one place — avoiding the fragility of two independent repos that need to be checked out side-by-side in a specific layout.

| Concern | Two independent repos | Orchestrator + submodules |
|---------|----------------------|---------------------------|
| **Compose files** | Awkward — need both repos side-by-side | Natural — compose references `./frontend` and `./backend` |
| **Deployment** | Need to know about two repos, coordinate | Single `make deploy-pi` from one repo |
| **Docs & plans** | Duplicated or split across repos | Centralized in orchestrator |
| **Kiosk scripts** | Don't belong in frontend OR backend | Live in orchestrator where they belong |
| **Dev setup** | Clone two repos manually | `git clone --recurse-submodules` — done |
| **CI** | Two separate CI configs to maintain | Orchestrator CI validates compose; each submodule has its own CI |
| **Familiarity** | New pattern | Already used and understood (dashtam pattern) |
| **Future services** | Where does `dashy-cli` live? | Just add another submodule |

---

## Target Repository Structure

### `dashy/` (orchestrator repo — stays as-is, gains submodules)

```
dashy/
├── .gitmodules                   # NEW — points to dashy-kiosk + dashy-api
├── Makefile                      # Updated — orchestrates frontend + backend
├── AGENTS.md                     # Updated — orchestrator conventions
├── README.md                     # Updated — reflects submodule structure
├── compose/                      # Stays — docker-compose (dev + prod)
├── docs/                         # Stays — plans, guides
├── env/                          # Stays — shared .env files
├── scripts/                      # Stays — kiosk scripts, deploy helpers
├── mockups/                      # Stays
├── frontend/                     # → submodule (dashy-kiosk)
│   └── src/...
├── backend/                      # → submodule (dashy-api)
│   └── app/...
├── .qwen/                        # Stays — orchestrator skills
└── .github/workflows/            # Updated — compose validation CI
```

### `dashy-kiosk/` (new repo — frontend only)

```
dashy-kiosk/
├── src/                          # React app source
│   ├── main.tsx
│   ├── App.tsx
│   ├── core/
│   ├── domain/
│   ├── features/
│   ├── theme/
│   ├── shared/
│   └── types/
├── public/
├── tests/
├── package.json                  # pnpm, "packageManager" field
├── pnpm-lock.yaml
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── Dockerfile                    # Vite build → nginx serve
├── Dockerfile.dev                # Vite dev server
├── Makefile                      # Frontend-only targets
├── AGENTS.md                     # Frontend conventions (TSDoc, testing, etc.)
├── README.md
├── .qwen/skills/                 # Frontend-specific skills
└── .github/workflows/ci.yml     # Frontend CI: lint, typecheck, test, build
```

### `dashy-api/` (new repo — backend only)

```
dashy-api/
├── app/                          # FastAPI source
│   ├── main.py
│   ├── core/
│   ├── domain/
│   ├── infrastructure/
│   ├── api/
│   └── registry.py
├── tests/
├── env/                          # Backend-specific .env templates
├── pyproject.toml
├── Dockerfile
├── Dockerfile.dev
├── Makefile                      # Backend-only targets
├── AGENTS.md                     # Backend conventions (Google docstrings, etc.)
├── README.md                     # API-specific docs
├── .qwen/skills/                 # Backend-specific skills (quality-gate, etc.)
└── .github/workflows/ci.yml     # Backend CI: lint, typecheck, test, build
```

---

## API Contract

The two repos communicate via a well-defined API contract. The OpenAPI spec lives in `dashy-api`, and the frontend consumes it.

### Endpoints

```
GET /api/v1/weather?units=imperial     → WeatherResponse
GET /api/v1/calendar?start_date=...&end_date=...  → WeekCalendar
GET /api/v1/family                     → FamilyMember[]
GET /health                            → { status, version, cache }
```

### Single Source of Truth

| Side | File | Purpose |
|------|------|---------|
| Backend | `app/registry.py` | Defines all endpoints, providers, metadata |
| Frontend | `src/core/api/endpoints.ts` | Consumes endpoint definitions |

### Type Sync Strategy

**Current**: Types are manually duplicated in `frontend/src/types/index.ts` and `backend/app/models.py`.

**Decision**: Start with **manual sync + drift detection test**. Add a CI test that compares frontend types against backend OpenAPI spec. Upgrade to codegen later if drift becomes painful.

**Why not a shared types package:** Current scale is small (3 endpoints). A `@dashy/types` npm package adds publishing overhead that's not worth it yet.

---

## Migration Phases

### Phase S1: Create Submodule Repos

Create the two new repos from the existing code.

| Step | What | Risk |
|------|------|------|
| S1.1 | Create GitHub repo `dashy-api` | Low |
| S1.2 | Copy `backend/` directory contents to `dashy-api/` root (promote `backend/` to root) | Low — copy, not move |
| S1.3 | Create `dashy-api/Makefile` with backend-only targets | Low |
| S1.4 | Create `dashy-api/AGENTS.md` with backend conventions | Low |
| S1.5 | Create `dashy-api/README.md` with API docs | Low |
| S1.6 | Copy `.qwen/skills/` to `dashy-api/.qwen/skills/` (quality-gate) | Low |
| S1.7 | Create `.github/workflows/ci.yml` for `dashy-api` | Low |
| S1.8 | Create GitHub repo `dashy-kiosk` | Low |
| S1.9 | Copy `frontend/` directory contents to `dashy-kiosk/` root (promote `frontend/` to root) | Low — copy, not move |
| S1.10 | Create `dashy-kiosk/Makefile` with frontend-only targets | Low |
| S1.11 | Create `dashy-kiosk/AGENTS.md` with frontend conventions | Low |
| S1.12 | Create `dashy-kiosk/README.md` | Low |
| S1.13 | Create `.github/workflows/ci.yml` for `dashy-kiosk` | Low |

**Key decision**: Promote subdirectories to root (`backend/app/` → `app/`, `frontend/src/` → `src/`). This means updating Dockerfiles, Makefiles, and CI configs — but the result is cleaner paths and standard project layouts.

**Verification:** Both repos exist on GitHub with correct code. Each has its own CI, Makefile, AGENTS.md, README.md.

---

### Phase S2: Convert to Orchestrator

Convert `dashy/` from a monorepo to an orchestrator with submodules.

| Step | What | Risk |
|------|------|------|
| S2.1 | Add `.gitmodules` pointing to `dashy-kiosk` and `dashy-api` | Low |
| S2.2 | Remove `frontend/` source directory (replaced by submodule) | Medium — verify nothing breaks |
| S2.3 | Remove `backend/` source directory (replaced by submodule) | Medium — verify nothing breaks |
| S2.4 | Run `git submodule add` for both repos | Low |
| S2.5 | Update `dashy/Makefile` — targets now orchestrate submodules | Low |
| S2.6 | Update `dashy/AGENTS.md` — orchestrator conventions | Low |
| S2.7 | Update `dashy/README.md` — reflect submodule structure | Low |
| S2.8 | Update `compose/` Dockerfiles — build contexts point to submodule paths | Medium |

**Makefile orchestration pattern:**
```makefile
# Orchestrator targets
dev-up:
	docker compose -f compose/docker-compose.dev.yml up -d

deploy-pi:
	# Pull latest submodule commits
	git submodule update --remote --merge
	# Deploy via compose
	docker compose -f compose/docker-compose.prod.yml up -d --build

lint: lint-frontend lint-backend
test: test-frontend test-backend
build: build-frontend build-api

lint-frontend:
	$(MAKE) -C frontend lint

lint-backend:
	$(MAKE) -C backend lint

test-frontend:
	$(MAKE) -C frontend test

test-backend:
	$(MAKE) -C backend test
```

**Verification:** `git submodule status` shows both repos. `make lint && make test && make build` orchestrates both. App looks identical.

---

### Phase S3: Update CI

Each repo has independent CI. The orchestrator validates compose files.

**`dashy-kiosk` CI:**
```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  frontend:
    runs-on: ubuntu-latest
    steps:
      - checkout
      - setup pnpm
      - pnpm install --frozen-lockfile
      - pnpm run lint
      - pnpm run typecheck
      - pnpm run test
      - pnpm run build
```

**`dashy-api` CI:**
```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - checkout
      - setup Python
      - make lint-backend
      - make typecheck-backend
      - make test-backend
      - make build-backend
```

**`dashy` orchestrator CI:**
```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  compose-validation:
    runs-on: ubuntu-latest
    steps:
      - checkout (with submodules)
      - validate docker-compose files
      - make lint (orchestrates both)
```

**Verification:** PR to any repo triggers appropriate CI. All checks pass.

---

### Phase S4: Update Compose & Deploy

Update compose files to reference submodule paths and update deployment.

| Step | What | Risk |
|------|------|------|
| S4.1 | Update `compose/docker-compose.dev.yml` build contexts | Medium |
| S4.2 | Update `compose/docker-compose.prod.yml` build contexts | Medium |
| S4.3 | Update Dockerfiles if paths changed (S1 promoted to root) | Medium |
| S4.4 | Test dev environment: `make dev-up` | Medium |
| S4.5 | Test prod environment: `make deploy-pi` | Medium |
| S4.6 | Add SQLite volume mount (from B7) | Low |

**Compose build contexts (after S1 promotion):**
```yaml
# compose/docker-compose.prod.yml
services:
  frontend:
    build:
      context: ../frontend    # → dashy-kiosk submodule
      dockerfile: Dockerfile
  backend:
    build:
      context: ../backend     # → dashy-api submodule
      dockerfile: Dockerfile
    volumes:
      - ../backend/data:/app/data  # SQLite persistence
```

**Verification:** Dev and prod environments work. Both frontend and backend start correctly.

---

### Phase S5: Update Skills & Docs

| Step | What | Why |
|------|------|-----|
| S5.1 | Update `dashy/AGENTS.md` | Orchestrator conventions — no backend/frontend code details |
| S5.2 | Update `dashy-kiosk/AGENTS.md` | Frontend conventions (TSDoc, testing, pnpm, etc.) |
| S5.3 | Update `dashy-api/AGENTS.md` | Backend conventions (Google docstrings, testing, etc.) |
| S5.4 | Update `dashy/README.md` | Reflect submodule structure, clone instructions |
| S5.5 | Update `.qwen/skills/` in `dashy` | Remove direct code references, keep deploy/orchestration skills |
| S5.6 | Copy relevant skills to `dashy-kiosk/.qwen/skills/` | Frontend-specific skills |
| S5.7 | Copy relevant skills to `dashy-api/.qwen/skills/` | Backend-specific skills (quality-gate) |

**Verification:** AGENTS.md in each repo accurately describes that repo's conventions. Skills are scoped correctly.

---

### Phase S6: Deploy to Pi

| Step | What | Risk |
|------|------|------|
| S6.1 | SSH to Pi, clone `dashy-kiosk` and `dashy-api` repos | Low |
| S6.2 | Update `dashy` on Pi (new submodule structure) | Medium |
| S6.3 | Run `make deploy-pi` from Mac | Medium — verify two-submodule deploy |
| S6.4 | Verify frontend + backend both running on Pi | Medium |
| S6.5 | Verify health check passes | Low |

**Verification:** Pi serves frontend from `dashy-kiosk` and backend from `dashy-api`. Health check passes. `make deploy-pi` works end-to-end.

---

## CI/CD Strategy

### Current State
- GitHub Actions runs tests on PR
- Manual `make deploy-pi` after merge to `main`

### Target State

| Repo | CI Triggers | CI Jobs |
|------|-------------|---------|
| `dashy-kiosk` | Push, PR | lint, typecheck, test, build (pnpm) |
| `dashy-api` | Push, PR | lint, typecheck, test, build (Python/Docker) |
| `dashy` | Push, PR | compose validation, orchestrate lint/test |

**Deploy workflow** (unchanged):
- Merge to `main` in any repo
- Manual `make deploy-pi` from Mac
- Deploy script pulls latest submodule commits and rebuilds

### Future: Pre-built Images (Optional)

When CI is mature, build Docker images in CI and push to ghcr.io:

```yaml
# compose/docker-compose.prod.yml (future)
services:
  frontend:
    image: ghcr.io/faiyaz7283/dashy-kiosk:latest
  backend:
    image: ghcr.io/faiyaz7283/dashy-api:latest
```

**Why ghcr.io:** Already authenticated via GitHub Actions, no extra secrets, namespaced under `ghcr.io/faiyaz7283/`, free for public repos.

---

## Decisions Made

| Question | Decision | Rationale |
|----------|----------|-----------|
| **Architecture** | Orchestrator + submodules (dashtam pattern) | Proven pattern, compose/scripts/docs stay in one place, single deploy command |
| **Repo naming** | `dashy-api` (backend), `dashy-kiosk` (frontend) | `dashy-api` matches URL convention. `dashy-kiosk` captures the purpose (wall-mounted family display) better than `dashy-web` |
| **Subdirectory vs root** | Promote to root (`backend/app/` → `app/`) | Cleaner paths, standard project layout. Requires Dockerfile/Makefile updates but worth it |
| **Compose location** | Stays in `dashy` orchestrator | Single `make deploy-pi` orchestrates both. Both submodules checked out via `--recurse-submodules` |
| **Image registry** | ghcr.io (future, when CI is mature) | GitHub-native auth, no extra secrets, namespaced |
| **Shared types** | Manual sync + drift detection test | Small API surface (3 endpoints), upgrade to codegen later if needed |
| **Deploy script** | Update existing `make deploy-pi` | Already handles full deploy flow, just needs submodule awareness |
| **Package manager (frontend)** | pnpm only | User requirement. CI uses `pnpm install --frozen-lockfile` |

---

## Migration Checklist

- [ ] **S1**: Create `dashy-api` and `dashy-kiosk` repos with code from `backend/` and `frontend/`
- [ ] **S2**: Convert `dashy/` to orchestrator with `.gitmodules`
- [ ] **S3**: Set up CI for all three repos
- [ ] **S4**: Update compose files and deployment for submodule paths
- [ ] **S5**: Update AGENTS.md, README.md, and skills in all repos
- [ ] **S6**: Deploy to Pi with new submodule structure

---

## Execution Order

This plan should be executed **after** both the backend migration (B1-B7) and frontend migration (F1-F7) are complete.

```
Backend Migration (B1-B7) ──┐
                             ├──→ Repo Split (S1-S6)
Frontend Migration (F1-F7) ──┘
```

Each migration can proceed in parallel. The repo split depends on both being complete.

---

## Rollback Plan

If the split causes issues:

1. Revert `.gitmodules` and submodule additions in `dashy`
2. Copy `backend/` and `frontend/` source back from the submodule repos
3. Delete `dashy-api` and `dashy-kiosk` repos

The split is non-destructive — the original monorepo state can be restored at any point before Phase S2 (removing source directories from `dashy`).
