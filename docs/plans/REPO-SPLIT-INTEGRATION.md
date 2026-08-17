# Repo Split & Integration Plan

> Status: **DRAFT — awaiting review**
> Created: 2026-08-16
> Scope: Split the monorepo into separate frontend (`dashy`) and backend (`dashy-api`) repositories with a well-defined API contract.

---

## Rationale

After the frontend and backend migrations are complete, the codebases will have diverged significantly in structure and concerns. Splitting into separate repos provides:

- **Independent deployment** — frontend and backend can be deployed separately
- **Independent CI** — each repo has its own lint/test/build pipeline
- **Clear ownership** — frontend conventions in one repo, backend in another
- **Smaller context** — agents working on one side don't need to load the other
- **Separate versioning** — API breaking changes don't force frontend releases

---

## Target Repository Structure

### `dashy/` (current repo → frontend only)

```
dashy/
├── frontend/                   # Becomes root (or stays as subdirectory)
├── compose/                    # Stays (orchestration)
├── mockups/                    # Stays
├── docs/                       # Stays (includes migration plans)
├── scripts/                    # Stays (sync-memory.sh, etc.)
├── Makefile                    # Updated — no backend targets
├── AGENTS.md                   # Updated — frontend-only conventions
├── README.md                   # Updated
├── .qwen/                      # Stays (skills, settings)
└── .github/workflows/          # Updated — frontend CI only
```

### `dashy-api/` (new repo → backend only)

```
dashy-api/
├── backend/                    # Becomes root (or stays as subdirectory)
├── env/                        # Moves here
├── Makefile                    # New — backend-only targets
├── AGENTS.md                   # New — backend conventions
├── README.md                   # API-specific docs
├── .qwen/                      # New (skills: quality-gate, etc.)
├── .github/workflows/          # Backend CI: lint, typecheck, test, build
└── docker-compose.prod.yml     # Production compose (or stays in dashy)
```

---

## Decision: Subdirectory vs Root

**Option A: Keep subdirectories**
```
dashy/frontend/src/...
dashy-api/backend/app/...
```
- Pro: Minimal path changes, Dockerfiles stay the same
- Con: Extra nesting level

**Option B: Promote to root**
```
dashy/src/...
dashy-api/app/...
```
- Pro: Cleaner paths
- Con: Must update all Dockerfiles, Makefiles, CI configs, compose files

**Recommendation**: **Option A** — keep subdirectories. The nesting is minimal and avoids a massive path update.

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

**Options**:
1. **Manual sync** (current) — acceptable for small projects, use tests to catch drift
2. **OpenAPI codegen** — generate frontend types from backend OpenAPI spec
3. **Shared types package** — publish a `@dashy/types` npm package from the backend repo

**Recommendation**: Start with **Option 1** (manual sync + drift detection tests). Add a CI test that compares frontend types against backend OpenAPI spec. Upgrade to codegen later if drift becomes painful.

---

## Migration Steps

### Phase S1: Create `dashy-api` Repo

| Step | What | Risk |
|------|------|------|
| S1.1 | Create new GitHub repo `dashy-api` | Low |
| S1.2 | Copy `backend/` directory to `dashy-api/backend/` | Low — copy, not move |
| S1.3 | Copy `env/` directory to `dashy-api/env/` | Low |
| S1.4 | Create `dashy-api/Makefile` with backend-only targets | Low |
| S1.5 | Create `dashy-api/AGENTS.md` with backend conventions | Low |
| S1.6 | Create `dashy-api/README.md` with API docs | Low |
| S1.7 | Copy `.qwen/skills/` to `dashy-api/.qwen/skills/` (quality-gate) | Low |

**Verification**: `dashy-api` has all backend code. `dashy` still has backend code (not yet removed).

---

### Phase S2: Set Up CI for `dashy-api`

| Step | What | Risk |
|------|------|-----|
| S2.1 | Create `.github/workflows/ci.yml` for `dashy-api` | Low |
| S2.2 | CI runs: lint, typecheck, test, build | Low |
| S2.3 | CI uses Docker (same as current `make test-backend`) | Low |

**Verification**: PR to `dashy-api` triggers CI. All checks pass.

---

### Phase S3: Update `dashy` Compose Files

| Step | What | Risk |
|------|------|-----|
| S3.1 | Update `compose/docker-compose.dev.yml` to reference `dashy-api` image | Medium |
| S3.2 | Update `compose/docker-compose.prod.yml` to reference `dashy-api` image | Medium |
| S3.3 | Test dev environment: `make dev-up` | Medium — verify backend starts |
| S3.4 | Test prod environment: `make deploy-pi` | Medium — verify Pi deployment |

**Key change**: The backend service in compose files now builds from `dashy-api` repo (or pulls a pre-built image).

**Verification**: Dev and prod environments work with backend from `dashy-api`.

---

### Phase S4: Remove Backend from `dashy` Repo

| Step | What | Risk |
|------|------|-----|
| S4.1 | Remove `backend/` directory from `dashy` | Medium — verify nothing breaks |
| S4.2 | Remove `env/` directory from `dashy` (if moved to `dashy-api`) | Medium |
| S4.3 | Update `dashy/Makefile` — remove backend targets | Low |
| S4.4 | Update `dashy/AGENTS.md` — remove backend conventions | Low |
| S4.5 | Update `dashy/README.md` — remove backend docs | Low |

**Verification**: `make lint && make typecheck && make test && make build` — all pass (frontend only).

---

### Phase S5: Update `.qwen/skills/` in `dashy`

| Step | What | Why |
|------|------|-----|
| S5.1 | Update `quality-gate` skill — frontend-only targets | Remove backend references |
| S5.2 | Keep `deploy-pi` skill — still relevant | Deploy now orchestrates two repos |
| S5.3 | Keep `dev-env` skill — still relevant | Dev env now references `dashy-api` |
| S5.4 | Keep `mockup` skill — frontend-only | No changes needed |

**Verification**: Skills are accurate for the new structure.

---

### Phase S6: Update Documentation

| Step | What | Why |
|------|------|-----|
| S6.1 | Update `dashy/README.md` — mention `dashy-api` repo | Clarity |
| S6.2 | Update `dashy-api/README.md` — mention `dashy` repo | Clarity |
| S6.3 | Update `AGENTS.md` in both repos — reflect new structure | Agent accuracy |
| S6.4 | Update `docs/plans/REPO-SPLIT-INTEGRATION.md` — mark complete | Historical record |

---

### Phase S7: Deploy to Pi

| Step | What | Risk |
|------|------|-----|
| S7.1 | SSH to Pi, clone `dashy-api` repo | Low |
| S7.2 | Update `dashy` on Pi (new compose files) | Medium |
| S7.3 | Run `make deploy-pi` from Mac | Medium — verify two-repo deploy |
| S7.4 | Verify frontend + backend both running on Pi | Medium |

**Verification**: Pi serves frontend from `dashy` and backend from `dashy-api`. Health check passes.

---

## Compose File Strategy

### Option A: Compose stays in `dashy`, references `dashy-api` build context

```yaml
# dashy/compose/docker-compose.prod.yml
services:
  frontend:
    build:
      context: ../frontend
  backend:
    build:
      context: ../../dashy-api/backend  # Relative path to other repo
```

- Pro: Single `make deploy-pi` orchestrates both
- Con: Requires both repos checked out side-by-side on Pi

### Option B: Each repo has its own compose file

```yaml
# dashy/compose/docker-compose.prod.yml (frontend only)
services:
  frontend:
    build: ../frontend

# dashy-api/docker-compose.prod.yml (backend only)
services:
  backend:
    build: ./backend
```

- Pro: Each repo is self-contained
- Con: Need to run two deploy commands, or a wrapper script

### Option C: Pre-built images

```yaml
# dashy/compose/docker-compose.prod.yml
services:
  frontend:
    image: ghcr.io/faiyaz7283/dashy-frontend:latest
  backend:
    image: ghcr.io/faiyaz7283/dashy-api:latest
```

- Pro: No build on Pi, fast deploys
- Con: Need CI to build and push images

**Recommendation**: **Option A** for now (simplest migration). Upgrade to **Option C** later when CI image building is set up.

---

## CI/CD Strategy

### Current State
- GitHub Actions runs tests on PR
- Manual `make deploy-pi` after merge to `main`

### Target State

**`dashy` repo CI:**
```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  frontend:
    runs-on: ubuntu-latest
    steps:
      - checkout
      - make lint-frontend
      - make typecheck-frontend
      - make test-frontend
      - make build-frontend
```

**`dashy-api` repo CI:**
```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - checkout
      - make lint-backend
      - make typecheck-backend  # (if added)
      - make test-backend
      - make build-backend
```

**Deploy workflow** (unchanged):
- Merge to `main` in either repo
- Manual `make deploy-pi` from Mac
- Deploy script detects which repo changed and rebuilds accordingly

---

## Migration Checklist

- [ ] **S1**: Create `dashy-api` repo with backend code
- [ ] **S2**: Set up CI for `dashy-api`
- [ ] **S3**: Update `dashy` compose files to reference `dashy-api`
- [ ] **S4**: Remove backend code from `dashy` repo
- [ ] **S5**: Update `.qwen/skills/` in both repos
- [ ] **S6**: Update documentation in both repos
- [ ] **S7**: Deploy to Pi with new two-repo setup

---

## Rollback Plan

If the split causes issues:
1. Revert compose file changes in `dashy` (Option A makes this easy)
2. Copy `backend/` back from `dashy-api` to `dashy`
3. Delete `dashy-api` repo

The split is non-destructive — the original monorepo state can be restored at any point before Phase S4 (removing backend from `dashy`).

---

## Open Questions

- [ ] **Repo naming**: `dashy-api` or `dashy-backend`?
- [ ] **Compose location**: Stay in `dashy` (Option A) or split (Option B)?
- [ ] **Image registry**: GitHub Container Registry (ghcr.io) or Docker Hub?
- [ ] **Shared types**: Manual sync, OpenAPI codegen, or shared package?
- [ ] **Deploy script**: Update `make deploy-pi` to handle two repos, or create a new target?

---

## Execution Order

This plan should be executed **after** both the backend migration (B1-B6) and frontend migration (F1-F7) are complete.

```
Backend Migration (B1-B6) ──┐
                             ├──→ Repo Split (S1-S7)
Frontend Migration (F1-F7) ──┘
```

Each migration can proceed in parallel. The repo split depends on both being complete.
