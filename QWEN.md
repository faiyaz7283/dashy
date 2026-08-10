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
- **Views:** Day, Week, Month, Year with navigation and auto-refresh
- **Header:** Auto-collapsing (hides after 3s, shows on mouse near top)
- **Backend:** Enhanced with event deduplication, attendees, recurring events, full event details
- **Frontend:** Unified event architecture — `EventItem` (card/strip/block) + `useEventInteraction` across all views; see `frontend/src/docs/event-architecture-analysis.md`
- **Event interactions:** Uniform across views — hover event = popup, click event = modal, click day = drill down (year view is navigation-only)
- **Layout:** Fluid full-viewport — all views fill available width AND height (week/month/year grids stretch). On monitors wider than 1920px the whole UI scales up uniformly via CSS `zoom` on the app root (`useUiScale`); never scales down, so 1080p-class displays (Pi, laptops) keep constant design-size text. Popup/modal portal to `body` and apply the same factor to their content only.

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
├── scripts/               # Deployment scripts
│   ├── start-chromium-kiosk.sh    # Wrapper script with retry logic
│   └── chromium-kiosk.desktop     # Autostart configuration
├── env/                   # Environment variables
│   ├── .env.dev.example   # Template (committed)
│   └── .env.dev           # Actual values (gitignored)
├── frontend/              # React + TypeScript + Vite + Tailwind
│   ├── src/
│   │   ├── docs/          # Architecture analysis and design documents
│   │   │   └── event-architecture-analysis.md  # Event component refactor plan
│   │   ├── components/    # One component per folder with barrel export
│   │   │   ├── Header/           # Main header (logo, date, clock, weather, controls)
│   │   │   ├── Sidebar/          # Collapsible sidebar with navigation
│   │   │   ├── FamilyPills/      # Compact inline family member pills
│   │   │   ├── DensityBadge/     # Event count badge with density coloring
│   │   │   ├── StickyArea/       # Auto-collapsing sticky header wrapper
│   │   │   ├── ViewSwitcher/     # Day/Week/Month/Year view buttons
│   │   │   ├── SideNav/          # Previous/Next navigation arrows
│   │   │   ├── WeekGrid/         # Week view (7 day cards)
│   │   │   ├── DayCard/          # Individual day card component
│   │   │   ├── EventItem/        # Core event rendering (card/strip/block variants)
│   │   │   ├── EventPopup/       # Hover popup with event details
│   │   │   ├── EventModal/       # Event detail modal (all views)
│   │   │   ├── DayIndicator/     # Year view segmented event micro-bar
│   │   │   ├── DayView/          # Day view with hourly timeline
│   │   │   ├── MonthView/        # Month grid view
│   │   │   ├── YearView/         # Year view with mini calendars
│   │   │   ├── WeatherWidget/    # Current weather display
│   │   │   ├── Clock/            # Live clock display
│   │   │   ├── DateDisplay/      # Date picker for custom dates
│   │   │   └── StatusBar/        # Bottom status bar with refresh info
│   │   ├── hooks/         # Custom hooks
│   │   │   ├── useOrientation.ts    # Screen orientation detection
│   │   │   ├── useSidebar.ts        # Sidebar state management
│   │   │   ├── useApi.ts            # Generic API fetch hook
│   │   │   ├── useCalendarEvents.ts # Calendar events with caching
│   │   │   ├── useEventInteraction.ts # Unified event popup/modal state
│   │   │   ├── useUiScale.ts      # Uniform UI scale-up factor for wide monitors
│   │   │   └── useAutoHideHeader.ts # Auto-hide header on mouse proximity
│   │   ├── services/      # API service layer (api.ts with retry + cache)
│   │   ├── types/         # TypeScript type definitions
│   │   ├── theme/         # Design tokens (colors, spacing, typography)
│   │   ├── utils/         # Date formatting, density, recurrence utils
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
- **Co-author:** Always include `Co-Authored-By: Oz <oz-agent@warp.dev>`
- **PR Flow:** Work on `development` → Create PR → Merge to `main` → Deploy to Pi

### CI/CD Workflow (Smart Change Detection)

GitHub Actions uses intelligent change detection to optimize CI time:

**Change Detection:**
- `frontend/**` changes → run frontend tests + build frontend image
- `backend/**` changes → run backend tests + build backend image
- No code changes → skip all tests and builds
- Both changed → run everything

**Performance:**
- Frontend-only changes: Skip backend tests and image build
- Backend-only changes: Skip frontend tests and image build
- Documentation/config changes: Skip all tests and builds

**Implementation:**
- Uses `dorny/paths-filter` action to detect changes
- Separate jobs for frontend and backend
- Each job only runs when its component changes

### Deployment Workflow (Intelligent)

**CI Gate:** GitHub Actions MUST pass on `main` before deploying to Pi. Never deploy if CI is failing.

```bash
# 1. Verify CI passed on main
gh run list --limit 1 --branch main
# Must show ✓ status before proceeding

# 2. Deploy to Pi
make deploy-pi
```

This command uses smart change detection to optimize deployment time:

1. **Detects changes** by comparing last deployed commit with current HEAD
2. **Categorizes changes**:
   - `frontend/**` changes → rebuild frontend only
   - `backend/**` changes → rebuild backend only
   - `compose/` or `.env` changes → full infrastructure rebuild
   - Other changes (Makefile, scripts, etc.) → no rebuilds needed
3. **Deploys only what changed**:
   - Stops/rebuilds/restarts only affected services
   - Updates Chromium kiosk configuration if scripts changed
   - Verifies deployment
4. **Syncs branches**: Merges `main` into `development` and pushes

**Performance:**
- **Frontend-only changes**: ~30-60 seconds (instead of 3-4 minutes)
- **Backend-only changes**: ~30-60 seconds
- **No changes**: Instant skip
- **Infrastructure changes**: Full rebuild (same as before)

**Key points:**
- Always use `make deploy-pi` for Pi deployments (never manual steps)
- Frontend builds with `--no-cache` only when frontend changes (ensures build args are applied)
- Kiosk auto-restarts after deployment
- Local machine stays on `development` branch after deployment
- Tracks last deployed commit on Pi in `.last-deployed-commit` file

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

## Layout & Display Scaling (Design Principle)

**Dashy is a fluid, full-window application. Every feature — current and future (todo lists, rewards, etc.) — must fit the visible window perfectly on any display, with no page-level scrolling and no hardcoded viewport assumptions.**

The model:

1. **Fluid layout** — The app fills the viewport edge to edge. Views stretch their content (flex/grid, `minmax(0, 1fr)` rows) to fill the available area rather than using natural content height. Overflow is clipped inside views, never a page scrollbar.
2. **Uniform scale-up via CSS `zoom`** — `useUiScale` returns `max(1, viewportWidth / layout.designWidth)` (designWidth = 1920). Applied as `zoom` on the app root in `App.tsx`. Zoom reflows layout — unlike `transform: scale`, which breaks sticky/fixed positioning and letterboxes (reverted after testing).
3. **Never scale down** — Displays ≤1920 CSS px wide (Pi TV, laptops) always render at 1.0 with design-size text. Readability beats fitting.
4. **Token-based sizing stays** — Components keep using px design tokens; tokens are the 1920px baseline and zoom handles larger screens. Do NOT introduce vw/clamp sizing in components.
5. **Floating layers** — Popups/modals render via `createPortal` to `document.body` (outside the zoomed root) so viewport/cursor coordinates stay exact; apply the `useUiScale` factor to their content wrapper only.
6. **vh gotcha** — Under zoom, `100vh` evaluates in zoomed pixels; divide by the factor: `height: calc(100vh / ${uiScale})` (see App.tsx).
7. **Orientation-aware** — `useOrientation` (viewport-based) drives portrait layouts: week view uses 2 columns (`weekGridPortrait`), year view 3×4 (`yearGridPortrait`), and the header stacks its controls on a second row. Views must keep filling the available height in both orientations.
8. **Display test matrix** — Verify visual changes on: Pi TV (1366×768 class), laptop (~1440–1512 CSS px), a large/ultrawide monitor (≥2560 CSS px), and portrait (a tall narrow browser window is enough).

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

### Auto-Collapsing Header

**Feature:** Header automatically hides to maximize calendar viewing space.

**Behavior:**
- Header visible when mouse is within 60px of top of screen
- Collapses after 3 seconds when mouse leaves trigger zone
- Smooth transition (150ms) using maxHeight animation
- Content smoothly moves up when header collapses
- Implemented via `useAutoHideHeader` hook

### Header Consolidation

**Feature:** Reduced header from 3 rows to 1 row for better space utilization.

**Changes:**
- FamilyPills made compact (16px avatars, 11px names) and moved into header row
- DensityBadge moved into header (between pills and ViewSwitcher)
- StickyArea simplified to only header + optional allDaySection
- Saves ~95px vertical space for calendar content

### Manual Refresh Fix

**Problem:** Manual refresh button was using cached data within 2-minute window.

**Solution:**
- Added `bypassCache` option to `getCalendar()` API function
- Added `forceRefresh()` to `useCalendarEvents` hook
- Sidebar refresh button now calls `forceRefresh()` to bypass cache

### Date Persistence Removed

**Problem:** Header date stuck on previous day after midnight (persisted in localStorage).

**Solution:**
- Removed localStorage persistence for `currentDate`
- `currentDate` now initializes to `new Date()` on every page load
- View type (day/week/month/year) still persisted
- Ensures tablet always shows today's schedule on reload

### Event Popup Positioning Fix

**Problem:** Popup flipped to opposite side of cursor when near viewport edge, creating large gaps.

**Solution:**
- Changed from flip logic to clamp logic
- Popup now stays as close to cursor as possible while avoiding viewport overflow
- Uses `Math.max/min` to clamp position within bounds

### CI Test Fixes

**Problem:** Tests failing on CI due to timezone issues and missing env vars.

**Solution:**
- Fixed timezone issues in `useCalendarEvents.test.ts` (use `new Date(year, month, day)` instead of ISO strings)
- Updated test assertions for new `getCalendar` options parameter
- Added `VITE_API_URL` to `vitest.config.ts` env

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
2. **Improved retry logic** (api.ts) — 5 retries with 2s base delay (2s, 4s, 8s, 16s, 32s = ~62 seconds total)
3. **Error retry interval** (useApi.ts) — Retries every 10 seconds when in error state instead of waiting for full polling interval
4. **Health check before fetching** (App.tsx) — Waits up to 30s for backend, shows "Connecting to backend..." message
5. **Deploy with --no-cache** (Makefile) — Ensures build args are always applied

### Blank Screen After Pi Reboot

**Problem:** After Pi reboot, Chromium showed blank grey screen instead of dashboard.

**Root cause:** Chromium autostart didn't wait for display server and backend services to be ready.

**Solution implemented:**
1. **Wrapper script** (`scripts/start-chromium-kiosk.sh`) — Waits up to 30s for X display, 120s for backend services
2. **Version-controlled configuration** — Autostart config tracked in git, deployed automatically
3. **Retry logic** — Script retries service checks before launching Chromium

### Weather Icon Not Displaying on Pi

**Problem:** Weather widget showed rectangle instead of emoji on Pi's Chromium.

**Root cause:** Pi's Chromium doesn't have emoji font support.

**Solution implemented:**
- **SVG-based icons** (`WeatherIcon.tsx`) — Replaced emoji with SVG icons for consistent rendering across all browsers/devices
- Better foundation for future animated weather features

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
- **Auto-start:** Wrapper script (`scripts/start-chromium-kiosk.sh`) with retry logic
- **Configuration:** Version-controlled in `scripts/chromium-kiosk.desktop`
- **Certificate:** mkcert root CA imported into Chromium's NSS database

The wrapper script ensures reliable startup by:
1. Waiting for X display to be ready (up to 30 seconds)
2. Waiting for backend services to be available (up to 120 seconds)
3. Only then launching Chromium in kiosk mode

### Deployment Command

```bash
make deploy-pi
```

This intelligent deployment command:
1. **Detects changes** between last deployment and current HEAD
2. **Syncs local `main` branch**
3. **Pushes to Pi** (git pull on Pi)
4. **Configures Chromium kiosk** (copies wrapper script and autostart config)
5. **Rebuilds only what changed** (frontend/backend/infrastructure)
6. **Restarts affected services** only
7. **Verifies deployment** (checks frontend and backend accessibility)
8. **Records deployment commit** on Pi
9. **Syncs branches** (merges main into development)

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
9. **Fluid display design** — Everything fluidly fits the visible window on any display (see Layout & Display Scaling). No hardcoded viewport assumptions, no page-level scrollbars

---

## Agent Instructions

**For Qwen Code sessions assisting with this repository:**

1. **Respect the structure** — Maintain the frontend/backend separation
2. **Always use Docker** — No local npm/pip installs outside containers for dev
3. **Update QWEN.md** — When conventions or status change
4. **Mock data first** — Build frontend with fake data, define API contract, then build backend
5. **Co-author commits** — Always include `Co-Authored-By: Oz <oz-agent@warp.dev>`
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
7. **Fluid layout required** — New views/features must fill the visible window (stretch via flex/grid + `minmax(0, 1fr)`), never introduce page-level scroll, and stay compatible with the root zoom scaling model: no vw/clamp sizing in components, floating layers portal to `body` and scale content via `useUiScale`. See "Layout & Display Scaling".

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

### Google Calendar API Integration

**Current Implementation (READ operations):**
- `events().list()` — Fetch events with date range filtering (`timeMin`/`timeMax`)
- `singleEvents=True` — Expand recurring events into individual instances
- `orderBy="startTime"` — Sort events chronologically

**Enhanced Backend Capabilities (Ready for Frontend):**
- **Event Deduplication** — Shared events across family calendars are merged into single events with combined attendees
- **Full Event Details** — Description, location, organizer identification
- **Attendee Management** — RSVP status tracking (accepted/declined/tentative/needsAction), color-coded by family member
- **Recurring Event Support** — Recurrence rules (RRULE) preserved, recurring event IDs tracked
- **External Guest Handling** — Non-family attendees shown with default grey color

**CalendarEvent Model Fields:**
```python
class CalendarEvent(BaseModel):
    id: str
    title: str
    start: str  # ISO format
    end: str  # ISO format
    all_day: bool = False
    members: list[str] = []  # Family member keys
    description: str | None = None
    location: str | None = None
    organizer: str | None = None  # Member key of organizer
    attendees: list[Attendee] = []  # Full attendee list with RSVP status
    recurring_event_id: str | None = None
    is_recurring_instance: bool = False
    recurrence_rule: str | None = None  # e.g., "RRULE:FREQ=WEEKLY;BYDAY=MO"
```

**Attendee Model:**
```python
class Attendee(BaseModel):
    member_key: str | None = None  # null for external guests
    email: str
    display_name: str
    status: Literal["accepted", "declined", "tentative", "needsAction"]
    color: str  # Family member color or default grey (#9ca3af)
```

**Future Enhancements (Not Yet Implemented):**
- Search capability (`events().list(q="...")`) — Deferred to dedicated session
- Event creation (`events().insert()`) — Requires OAuth 2.0 user consent flow
- Event updates (`events().patch()`) — Requires write permissions
- Real-time updates (`events().watch()`) — Requires public HTTPS endpoint (Cloudflare Tunnel)

### Git Workflow

20. **Atomic commits** — One logical change per commit. Clear messages describing "why" not just "what".
21. **Co-author all AI-assisted commits** — Always include `Co-Authored-By: Oz <oz-agent@warp.dev>`.
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
