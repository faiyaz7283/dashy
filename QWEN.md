# Dashy — Qwen Code Agent Instructions

## Project Overview

**Dashy** is a DIY family command center dashboard inspired by [Skylight Calendar](https://myskylight.com). It runs on a Raspberry Pi 4 + 1080p HDMI monitor in kiosk mode, displaying a weekly calendar synced with Google Calendar and a weather widget.

### Current Status

- **Phase:** Production deployed and working on Raspberry Pi with kiosk mode
- **Pi:** Raspberry Pi 4 (4GB), Raspberry Pi OS 64-bit (Bookworm/Debian 13), SSH accessible at `rpi4_main@dashy.local` (192.168.1.194)
- **Repo:** `git@github.com:faiyaz7283/dashy.git`
- **Directory:** `/Users/admin/dashy/` (flattened — no nested `dashy/dashy/`)
- **Local Dev URLs:** https://dashy.local (frontend), https://api.dashy.local (backend)
- **Pi URLs:** https://dashy.local (frontend), https://api.dashy.local (backend)
- **API Services:** Google Calendar + OpenWeatherMap (fall back to mock when credentials missing)
- **Kiosk:** Chromium auto-starts on boot, displays dashboard with real calendar data

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | React + Vite + TypeScript + Tailwind CSS | React 19, Vite 8, Node 24 |
| **Backend** | Python FastAPI + UV package manager | Python 3.13, FastAPI 0.115+, UV 0.12 |
| **Calendar** | Google Calendar API (service account) | — |
| **Weather** | OpenWeatherMap API (free tier) | — |
| **Reverse Proxy** | Traefik (shared infrastructure) | v3.7.10 |
| **Containerization** | Docker + Docker Compose | Docker 29.7, Compose v5.4 |
| **Package Management** | npm (frontend), UV (backend) | — |
| **Build automation** | Makefile (Docker-first) | — |
| **Pi OS** | Raspberry Pi OS 64-bit (Bookworm) | Debian 13, kernel 6.18 |

---

## Project Structure

```
dashy/
├── compose/               # Docker Compose files
│   ├── docker-compose.dev.yml      # Development environment
│   ├── docker-compose.prod.yml     # Production environment
│   ├── docker-compose.prod.yml.example  # Production template
│   └── traefik/           # Traefik config files (copied to Pi)
│       ├── traefik.yml
│       └── certs/
│           ├── _wildcard.local-key.pem
│           ├── _wildcard.local.pem
│           └── tls.yml
├── env/                   # Environment variables
│   ├── .env.dev.example   # Template (committed)
│   └── .env.dev           # Actual values (gitignored)
├── frontend/              # React + TypeScript + Vite + Tailwind
│   ├── src/
│   │   ├── components/    # One component per folder with barrel export
│   │   │   ├── Header/
│   │   │   ├── Sidebar/
│   │   │   ├── FamilyPills/
│   │   │   ├── WeekGrid/
│   │   │   ├── DayCard/
│   │   │   ├── EventCard/
│   │   │   ├── WeatherWidget/
│   │   │   └── Clock/
│   │   ├── data/          # Mock data (replaced by API calls later)
│   │   ├── hooks/         # Custom hooks (useOrientation, useSidebar, useApi)
│   │   ├── services/      # API service layer (api.ts with retry logic)
│   │   ├── types/         # TypeScript type definitions
│   │   ├── test/          # Test setup
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .husky/            # Git pre-commit hooks
│   ├── eslint.config.js
│   ├── vitest.config.ts
│   ├── vite.config.ts
│   ├── package.json
│   ├── Dockerfile         # Production build (with VITE_API_URL build arg)
│   ├── Dockerfile.dev     # Development with HMR
│   └── nginx.conf         # Production nginx config (with cache-busting headers)
├── backend/               # Python FastAPI + UV
│   ├── app/
│   │   ├── main.py        # FastAPI app (with CORS middleware)
│   │   └── config.py      # Pydantic settings (loads from .env)
│   ├── routes/            # API route handlers
│   ├── tests/
│   ├── pyproject.toml     # UV dependencies
│   ├── uv.lock            # Locked dependencies (committed)
│   ├── Dockerfile         # Production build
│   └── Dockerfile.dev     # Development with reload
├── mockups/               # Approved HTML mockups (design reference)
├── Makefile               # All commands (Docker-first, includes deploy-pi)
├── .gitignore
├── QWEN.md
└── README.md
```

---

## Development Workflow

### Prerequisites

1. **Traefik running** — Shared reverse proxy at `~/docker-services/traefik/`
   ```bash
   cd ~/docker-services && make traefik-up
   ```
2. **Hosts file entries** — Add to `/etc/hosts`:
   ```
   127.0.0.1 dashy.local api.dashy.local
   ```

### Docker-First Development (NO local dev)

```bash
make setup      # First-time setup (creates env/.env.dev from template)
make dev-up     # Start development environment (frontend + backend in Docker)
make dev-down   # Stop development environment
make dev-logs   # View logs (follow mode)
make dev-shell  # Shell into backend container
make dev-shell-frontend  # Shell into frontend container
make dev-restart  # Restart environment
make dev-rebuild  # Rebuild containers (no cache)

make lint       # Lint both frontend + backend
make format     # Format both frontend + backend
make typecheck  # TypeScript type check
make test       # Run all tests
make build      # Production builds
make clean      # Stop and clean all environments
```

### Local Development URLs (HTTPS via Traefik)

- **Frontend:** https://dashy.local
- **Backend API:** https://api.dashy.local
- **API Docs:** https://api.dashy.local/docs
- **Traefik Dashboard:** http://localhost:8080

### Key Principle: Zero Local Development

- **No npm/pip/uv/python/node runs on your Mac** — everything runs in Docker containers
- **`make dev-up` is your dev server** — not `npm run dev` or `uvicorn`
- **`make dev-shell` gets you into a container** — not `cd backend && python`
- **Env files in `env/` directory** — `env/.env.dev` (gitignored) holds secrets
- **Traefik handles HTTPS** — Shared reverse proxy with self-signed certs for local dev

### Git Workflow

- **Branch:** `development` for all work, `main` for stable releases
- **Commits:** Atomic, clear messages describing "why" not just "what"
- **Co-author:** Always include `Co-Authored-By: Qwen Code <qwen@alibabacloud.com>`
- **PR Flow:** Work on `development` → Create PR → Merge to `main` → Deploy to Pi

### Deployment Workflow (Automated)

```bash
make deploy-pi
```

This command:
1. Pulls latest `main` branch locally
2. Pushes to Pi (pulls `main` on Pi)
3. Stops containers on Pi
4. Builds frontend with `--no-cache` (ensures build args are applied)
5. Starts containers on Pi
6. Restarts Chromium kiosk
7. Verifies frontend and backend are accessible
8. Switches back to `development` branch locally

**Key points:**
- Always use `make deploy-pi` for Pi deployments (never manual steps)
- Frontend always builds fresh with `--no-cache` (Docker cache issue with build args)
- Kiosk auto-restarts after deployment
- Local machine stays on `development` branch after deployment

### Frontend-First Approach

1. Build UI with mock/dummy data
2. Get layout, styling, and interactions right
3. Define API contract (endpoints the frontend expects)
4. Build backend to match that contract
5. Swap mock data for real API calls

---

## Configuration

### Family Members (configurable via `.env`, not hardcoded)

```env
FAMILY_MEMBERS=[
  {"name": "Faiyaz", "calendar_id": "faiyaz@gmail.com", "color": "#4A90E2"},
  {"name": "Trisha", "calendar_id": "trisha@gmail.com", "color": "#E24A8D"}
]
```

Children (Arya, 8 and Raya, 4) are not in v1 calendar scope but the system supports adding them later.

### Calendar

- **Calendar ID:** `535602bea26fd600944e862523e7d514a7acda150fa0c949da0c9e2e94f693b7@group.calendar.google.com`
- **Service Account:** `dashy-calendar@dashy-504518.iam.gserviceaccount.com`
- **Week view:** ISO week (Mon–Sun)

### Weather

- **Location:** Levittown, NY 11756 (lat: 40.7259, lon: -73.5143)
- **API:** OpenWeatherMap (free tier, 1000 calls/day)

---

## Visual Style

- Skylight-inspired soft pastels
- Easily customizable via Tailwind CSS theme
- Clean, minimal, family-friendly

---

## Raspberry Pi Details

- **Hostname:** `dashy`
- **Username:** `rpi4_main`
- **IP:** 192.168.1.194 (DHCP, may change)
- **SSH:** Key-based auth (ed25519)
- **Boot medium:** microSD card (64GB)
- **Display:** 1080p HDMI (Hisense), NOT touchscreen
- **Kiosk mode:** Chromium auto-start on boot, full-screen

---

## Known Issues & Resolutions

### "Error: Failed to fetch" on Pi Kiosk

**Problem:** Pi kiosk showed "Error: Failed to fetch" after deployment.

**Root causes:**
1. Browser cached old JS bundles from previous builds
2. Backend wasn't ready when kiosk started (race condition)
3. Network issues caused transient fetch failures

**Solutions implemented:**
1. **Cache-busting headers** (nginx.conf) — Prevents browser caching of JS bundles
   ```
   Cache-Control: no-cache, no-store, must-revalidate
   Pragma: no-cache
   Expires: 0
   ```
2. **Retry logic with exponential backoff** (api.ts) — 3 retries with 1s, 2s, 4s delays
3. **Health check before fetching** (App.tsx) — Waits up to 30s for backend, shows "Connecting to backend..." message
4. **Deploy with --no-cache** (Makefile) — Ensures build args are always applied

### Docker Build Cache Issue with VITE_API_URL

**Problem:** Docker's build cache doesn't track `ARG` instructions in the cache key. When `VITE_API_URL` changed, Docker used cached layers with the old value baked into the JS bundle.

**Solution:** `make deploy-pi` uses `--no-cache` for frontend builds to ensure build args are always applied.

### mkcert Certificate Trust on Pi

**Problem:** Chromium on Pi didn't trust mkcert certificates, showing certificate warnings.

**Solution:** Imported mkcert root CA into Chromium's NSS database on Pi:
```bash
certutil -d sql:/home/rpi4_main/.pki/nssdb -A -t 'C,,' -n 'mkcert' -i /tmp/rootCA.pem
```

---

## Raspberry Pi Deployment Details

### Kiosk Mode Setup

- **Browser:** Chromium with kiosk flags
- **URL:** `https://dashy.local` (HTTPS via Traefik)
- **Auto-start:** systemd service (`lightdm`) restarts on boot
- **Certificate:** mkcert root CA imported into Chromium's NSS database

### Deployment Command

```bash
make deploy-pi
```

This fully automated command:
1. Syncs local `main` branch
2. Deploys to Pi (git pull, docker compose up --build)
3. Restarts Chromium kiosk
4. Verifies deployment
5. Switches back to `development` branch

### Pi Environment

- **Hostname:** `dashy`
- **Username:** `rpi4_main`
- **IP:** 192.168.1.194 (DHCP, may change)
- **SSH:** Key-based auth (ed25519)
- **Boot medium:** microSD card (64GB)
- **Display:** 1080p HDMI (Hisense), NOT touchscreen

---

## Guidelines for Development

1. **Latest versions only** — No compromise on using outdated packages
2. **Docker for everything** — Dev, test, build, deploy all containerized
3. **Makefile for all commands** — No memorizing long docker commands
4. **QWEN.md stays current** — Update whenever conventions or status change
5. **Frontend first** — Mock data, then backend to match
6. **Configurable, not hardcoded** — Family members, colors, API keys all via `.env`
7. **Lint-free code** — Run linters before committing
8. **TypeScript-ready** — React setup should support TS migration if needed later

---

## Agent Instructions

**For Qwen Code sessions assisting with this repository:**

1. **Respect the structure** — Maintain the frontend/backend separation
2. **Always use Docker** — No local npm/pip installs outside containers for dev
3. **Update QWEN.md** — When conventions or status change
4. **Mock data first** — Build frontend with fake data, define API contract, then build backend
5. **Co-author commits** — Always include `Co-Authored-By: Qwen Code <qwen@alibabacloud.com>`
6. **Latest versions** — Never pin to old versions unless there's a specific compatibility reason
7. **Pi deployment** — Test with `docker-compose.prod.yml` before deploying to Pi

---

## Agent Enforcement Rules

**These rules apply to ALL AI agent sessions working on this repository. They are enforced at two levels:**
1. **This document** — tells the agent what the rules are (soft enforcement)
2. **Git pre-commit hooks** — enforces at commit time (hard enforcement via Husky + ESLint + Prettier)

### Frontend Code Standards

1. **TypeScript required** — All new components must be `.tsx`. No `any` types without a comment explaining why.
2. **One component per folder** — Each component lives in its own folder under `src/components/` with `Component.tsx`, `Component.test.tsx`, and `index.ts` barrel export.
3. **Every new component must have a test file** — Even a basic render test. Add tests as you build.
4. **Mock data in `src/data/`** — Never inline mock data in components. Keep it in the `data/` folder for easy swap to API calls later.
5. **Custom hooks in `src/hooks/`** — Reusable logic (orientation detection, sidebar state) goes in hooks, not components.
6. **Type definitions in `src/types/`** — All TypeScript interfaces/types live in `src/types/index.ts`.

### Linting & Formatting

7. **ESLint must pass** — No unused imports, no console.log (except warn/error), no React hooks violations.
8. **Prettier enforces style** — No debates about spacing, quotes, or trailing commas. Prettier config is in `.prettierrc`.
9. **Pre-commit hooks block bad code** — Husky runs `lint-staged` on every commit. If lint fails, the commit is blocked.
10. **Run `make lint` before committing** — Catch issues early. `make lint:fix` auto-fixes what it can.

### Makefile Commands

11. **Use Makefile targets** — All dev/lint/test/build commands go through the Makefile. Frontend targets are prefixed `frontend:`, backend targets `backend:`.
12. **Never run raw npm/pip/uv commands locally** — Use `make dev-up` not `cd frontend && npm run dev`. All commands run through Docker containers.

### Docker-First Development

13. **Zero local development** — No npm/pip/uv/python/node runs on your local machine. Everything runs in Docker containers via `docker compose`.
14. **Docker Compose is the dev environment** — `make dev-up` starts everything. `make dev-shell` gets you into a container.
15. **Env files in `env/` directory** — `env/.env.dev` (gitignored) for local secrets, `env/.env.dev.example` (committed) as template.
16. **Never commit secrets** — `.env` files are gitignored. Only `.env.example` files with placeholder values are committed.
17. **Package management via Makefile** — Use `make install-frontend`, `make add-backend PACKAGE=<name>`, etc. Never run `npm install` or `uv add` directly on local machine.
18. **All repeated tasks via Makefile** — If you do something more than once, create a Makefile target. This prevents manual errors and enforces consistency.

### Backend Package Management (UV)

17. **UV for all Python packages** — Use `uv add` to add dependencies, never `pip install`. UV lock file (`uv.lock`) must be committed.
18. **pyproject.toml is the source of truth** — All dependencies listed there. UV syncs from it.
19. **Ruff for linting + formatting** — Replaces flake8 + black + isort. Config in `pyproject.toml`.

### REST API Standard

28. **REST API only** — All backend endpoints must follow REST conventions. No GraphQL, no RPC-style endpoints.
29. **REST conventions:**
   - Use HTTP methods correctly: GET (read), POST (create), PUT (update), DELETE (delete)
   - Resource-based URLs: `/api/calendar`, `/api/weather`, `/api/family`
   - Plural resource names: `/api/events` not `/api/event`
   - Proper HTTP status codes: 200 (OK), 201 (Created), 400 (Bad Request), 404 (Not Found), 500 (Server Error)
   - JSON request/response bodies
   - No verbs in URLs: `/api/calendar/refresh` → POST `/api/calendar/refresh` or better yet, use cache headers
30. **OpenAPI docs auto-generated** — FastAPI generates `/docs` automatically. Keep it accurate with proper type hints and docstrings.

### Git Workflow

20. **Atomic commits** — One logical change per commit. Clear messages describing "why" not just "what".
21. **Co-author all AI-assisted commits** — Always include `Co-Authored-By: Qwen Code <qwen@alibabacloud.com>`.
22. **Branch: `development`** — All work on `development`, `main` is for stable releases only.

### Architecture Decisions

23. **Frontend-first** — Build UI with mock data, get it right, then build backend to match.
24. **Configurable, not hardcoded** — Family members, colors, API keys all via `.env` or config files.
25. **Docker for everything** — Dev, test, build, deploy all containerized.
26. **Latest versions only** — No compromise on outdated packages.
27. **Update QWEN.md** — When conventions, structure, or status change, update this file immediately.

---

## Infrastructure

### Traefik Reverse Proxy (Shared)

- **Location:** `~/docker-services/traefik/`
- **Version:** v3.7.10 (latest stable)
- **Network:** `traefik-public` (external, shared across projects)
- **Ports:** 80 (HTTP), 443 (HTTPS), 8080 (Dashboard)
- **Management:** `cd ~/docker-services && make traefik-up/down/restart/logs`

### Docker Compose Project Naming

- **Project name:** `dashy-dev` (set in `compose/docker-compose.dev.yml`)
- **Container names:** `dashy-dev-frontend`, `dashy-dev-backend`
- **Pattern:** `{project}-{service}` (matching dashtam convention)

### Local Domain Routing

| Service | Domain | Traefik Router |
|---------|--------|----------------|
| Frontend | `dashy.local` | `dashy-dev-frontend` |
| Backend API | `api.dashy.local` | `dashy-dev-backend` |
| API Docs | `api.dashy.local/docs` | (same as backend) |

### Environment Variables

- **File:** `env/.env.dev` (gitignored)
- **Template:** `env/.env.dev.example` (committed)
- **Key vars:** `GOOGLE_CALENDAR_ID`, `GOOGLE_SERVICE_ACCOUNT_JSON`, `OPENWEATHERMAP_API_KEY`, `FAMILY_MEMBERS`

### MCP Servers

- **Context7** — Installed globally via npm (`npm install -g @upstash/context7-mcp`). Provides latest package documentation and version info.
  - Configured in `~/.qwen/settings.json` under `mcpServers`
  - Use to check latest stable versions before adding dependencies
