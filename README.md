# Dashy

A DIY family command center dashboard inspired by [Skylight Calendar](https://myskylight.com). Dashy runs on a Raspberry Pi in kiosk mode, displaying a family calendar synced with Google Calendar and a weather widget.

> **Agent note:** If you are an AI coding agent, read `AGENTS.md` first for hard behavior rules (Docker-first commands, testing requirements, etc.). This file is project knowledge.

---

## Current Status

- **Phase:** Production deployed and working on a Raspberry Pi 4 in kiosk mode.
- **Pi:** Raspberry Pi 4 (4GB), Raspberry Pi OS 64-bit (Bookworm/Debian 13), SSH accessible at `rpi4_main@dashy.local` (192.168.1.194), booting from an NVMe SSD (WD Blue SN500 500 GB via Realtek RTL9210 USB bridge). Original 64 GB microSD preserved as rollback.
- **Repo:** `git@github.com:faiyaz7283/dashy.git`
- **Local Dev URLs:** https://dashy.local (frontend), https://api.dashy.local (backend)
- **Pi URLs:** https://dashy.local (frontend), https://api.dashy.local (backend)
- **API Services:** Google Calendar + OpenWeatherMap (falls back to mock data when credentials are missing)
- **Kiosk:** Chromium auto-starts on boot, displays the dashboard with real calendar data
- **Views:** Day, Week, Month, Year with navigation and auto-refresh
- **Weather integration:** Current conditions and forecasts displayed across all views with 1:1 OWM condition icons (15 unique SVG icons with day/night variants), detailed hover tooltips with value-aware metric icons
- **Header:** Auto-hiding (proximity-based), single row, responsive compaction tiers; no logo/hamburger
- **Backend:** Enhanced with event deduplication, attendees, recurring events, full event details
- **Frontend:** Unified event architecture — `EventItem` (card/strip/block) + `useEventInteraction` across all views; see `frontend/src/docs/event-architecture-analysis.md`
- **Event interactions:** Uniform across views — hover event = popup, click event = modal, click day = drill down (year view is navigation-only)
- **Layout:** Fluid full-viewport — all views fill available width and height. On monitors wider than 1920 CSS px the whole UI scales up uniformly via CSS `zoom` on the app root (`useUiScale`); it never scales down, so 1080p-class displays keep a constant design-size text. Popups/modals portal to `body` and apply the same scale factor to their content only.

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
| **Build Automation** | Makefile (Docker-first) | — |
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
│   │   ├── components/    # One component per folder with barrel export
│   │   ├── hooks/         # Custom hooks
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
│   ├── routes/            # API route handlers
│   ├── tests/
│   ├── pyproject.toml     # UV dependencies
│   ├── uv.lock            # Locked dependencies (committed)
│   ├── Dockerfile         # Production build
│   └── Dockerfile.dev     # Development with reload
├── mockups/               # Approved HTML mockups (design reference)
├── Makefile               # All commands (Docker-first, includes deploy-pi)
├── .gitignore
├── AGENTS.md              # AI agent behavior rules
└── README.md              # This file
```

---

## Development Workflow

### Prerequisites

1. **Traefik running** — shared reverse proxy at `~/docker-services/traefik/`
   ```bash
   cd ~/docker-services && make traefik-up
   ```
2. **Hosts file entries** — add to `/etc/hosts`:
   ```
   127.0.0.1 dashy.local api.dashy.local
   ```

### Docker-First Development

All development commands run through the Makefile and execute inside Docker containers.

```bash
make setup      # First-time setup (creates env/.env.dev from template)
make dev-up     # Start development environment
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

See `AGENTS.md` for the hard rule that no `npm`, `pip`, `uv`, or similar commands should be run directly on the host.

### Local Development URLs (HTTPS via Traefik)

- **Frontend:** https://dashy.local
- **Backend API:** https://api.dashy.local
- **API Docs:** https://api.dashy.local/docs
- **Traefik Dashboard:** http://localhost:8080

### Git Workflow

- **Branch:** `development` for all work, `main` for stable releases.
- **PR Flow:** Work on `development` → create PR → merge to `main` → deploy to Pi.
- AI-assisted commits should include `Co-Authored-By: Oz <oz-agent@warp.dev>`.

### CI/CD Workflow

GitHub Actions uses intelligent change detection:

- `frontend/**` changes → run frontend tests + build frontend image.
- `backend/**` changes → run backend tests + build backend image.
- No code changes → skip all tests and builds.
- Both changed → run everything.

Implementation uses `dorny/paths-filter` with separate jobs for frontend and backend.

### Deployment Workflow

**CI Gate:** GitHub Actions must pass on `main` before deploying to the Pi.

```bash
# 1. Verify CI passed on main
gh run list --limit 1 --branch main

# 2. Deploy to Pi
make deploy-pi
```

`make deploy-pi`:
1. Detects changes between the last deployed commit and current HEAD.
2. Categorizes changes:
   - `frontend/**` changes → rebuild frontend only.
   - `backend/**` changes → rebuild backend only.
   - `compose/` or `.env` changes → full infrastructure rebuild.
   - Other changes (Makefile, scripts, etc.) → no rebuilds needed.
3. Deploys only what changed, restarts affected services, and updates kiosk config if scripts changed.
4. Verifies deployment.
5. Syncs branches by merging `main` into `development` and pushing.

---

## Configuration

### Family Members

Family members are configurable via `.env`, not hardcoded:

```env
FAMILY_MEMBERS=[
  {"name": "Faiyaz", "calendar_id": "faiyaz@gmail.com", "color": "#4A90E2"},
  {"name": "Trisha", "calendar_id": "trisha@gmail.com", "color": "#E24A8D"}
]
```

Children (Arya, 8 and Raya, 4) are not in v1 calendar scope but the system supports adding them later.

### Calendar

- **Calendar ID:** configured in `.env`
- **Service Account:** `dashy-calendar@dashy-504518.iam.gserviceaccount.com`
- **Week view:** ISO week (Mon–Sun)

### Weather

- **Location:** Levittown, NY 11756 (lat: 40.715401, lon: -73.512924)
- **API:** OpenWeatherMap One Call API 4.0 (free tier, 1000 calls/day)
- **Environment control:** `WEATHER_USE_MOCK` env var — `true` in development (returns mock data to stay within API limits), `false` in production (calls real API). Multiple dev machines share the same mock data structure, ensuring code parity with production.
- **API architecture:** Modular endpoints with pagination:
  - `/data/4.0/onecall/current` — current weather
  - `/data/4.0/onecall/timeline/1h` — hourly forecast (48 hours, paginated, 20 records/page)
  - `/data/4.0/onecall/timeline/1day` — daily forecast (fetches 20 days, returns 19 after filtering past entries, paginated, 10 records/page)
- **Billing:** ~720 calls/day at 10-minute refresh (under 1000 free limit). Each paginated page counts as a separate call.
- **Unit conversion:** Supports metric (Celsius) and imperial (Fahrenheit) via `?units=` query parameter (default: imperial). Backend always fetches Celsius from OpenWeatherMap and converts based on request.
- **Integration:** Weather displays across all calendar views (Day, Week, Month) with hover tooltips showing detailed forecasts including hourly temperature charts.
- **Icons:** All 15 OWM `weather.main` conditions map 1:1 to unique SVG icons (no grouping). Each condition has day/night color variants (darker at night). Clear night shows a moon with stars; other conditions use darker cloud/line colors at night.
- **Timezone handling:** All timestamps converted using OWM's `timezone_offset` field, ensuring forecast dates align with local time (no past-day dates in the forecast).
- **Tooltip metrics:** Value-aware SVG icons for temperature (color-coded by feel), humidity (opacity scales), wind (more lines = stronger), UV (color+size by intensity), precipitation (more drops = higher chance), pressure (barometer needle), and 8 moon phases.
- **Test coverage:** 53 backend tests (unit conversion, 4.0 API parsing, timezone handling, mock data validation, endpoint behavior), 11 frontend tests (WeatherTooltip rendering, hourly chart visibility, unified content for all 19 days, day labels).

---

## Visual Style

- Skylight-inspired soft pastels.
- Easily customizable via Tailwind CSS theme.
- Clean, minimal, family-friendly.

---

## Layout & Display Scaling

Dashy is a fluid, full-window application. Every feature — current and future — must fit the visible window perfectly on any display, with no page-level scrolling and no hardcoded viewport assumptions.

1. **Fluid layout** — the app fills the viewport edge to edge. Views stretch content (flex/grid, `minmax(0, 1fr)` rows) to fill the available area rather than using natural content height. Overflow is clipped inside views, never a page scrollbar.
2. **Uniform scale-up via CSS `zoom`** — `useUiScale` returns `max(1, viewportWidth / layout.designWidth)` (designWidth = 1920). Applied as `zoom` on the app root in `App.tsx`. Zoom reflows layout, unlike `transform: scale`, which breaks sticky/fixed positioning and letterboxes.
3. **Never scale down** — displays ≤1920 CSS px wide always render at 1.0 with design-size text. Readability beats fitting.
4. **Token-based sizing stays** — components keep using px design tokens; tokens are the 1920px baseline and zoom handles larger screens. Do not introduce `vw`/`clamp` sizing in components.
5. **Floating layers** — popups/modals render via `createPortal` to `document.body` (outside the zoomed root) so viewport/cursor coordinates stay exact; apply the `useUiScale` factor to their content wrapper only.
6. **vh gotcha** — under zoom, `100vh` evaluates in zoomed pixels; divide by the factor: `height: calc(100vh / ${uiScale})` (see `App.tsx`).
7. **Orientation-aware** — `useOrientation` (viewport-based) drives portrait layouts: week view uses 2 columns, year view 3×4, and the header stacks its controls on a second row. Views must keep filling the available height in both orientations.
8. **Display test matrix** — verify visual changes on: Pi TV (1366×768 class), laptop (~1440–1512 CSS px), a large/ultrawide monitor (≥2560 CSS px), and portrait.

---

## Raspberry Pi Details

> **Hardware is current deployment state, not a project dependency.** Dashy is hardware-agnostic in principle. Update this section whenever the Pi, storage, display, or peripherals change.

- **Hostname:** `dashy`
- **Username:** `rpi4_main`
- **IP:** 192.168.1.194 (DHCP, may change)
- **SSH:** Key-based auth (ed25519)
- **Boot medium:** NVMe SSD (WD Blue SN500 500 GB) via Realtek RTL9210 USB 3.0 bridge
- **Rollback medium:** Original 64 GB microSD card (untouched; can be reinserted to boot)
- **Display:** 1360×768 HDMI TV (Hisense), NOT touchscreen
- **Kiosk mode:** Chromium auto-start on boot, full-screen, mouse cursor auto-hides after 2 s of idle (handled by the frontend so it works on X11 and Wayland)

### Rotating the Display (Portrait Mode)

The Pi runs the **labwc** Wayland compositor — use `wlr-randr`. (`xrandr` fails with `BadMatch`; it's only an XWayland shim here.)

```bash
# Rotate to portrait (90°):
ssh r4pi "XDG_RUNTIME_DIR=/run/user/1000 WAYLAND_DISPLAY=wayland-0 wlr-randr --output HDMI-A-2 --transform 90"

# Rotate back to landscape:
ssh r4pi "XDG_RUNTIME_DIR=/run/user/1000 WAYLAND_DISPLAY=wayland-0 wlr-randr --output HDMI-A-2 --transform normal"
```

- **Output name:** `HDMI-A-2` — if rotation ever fails, verify with `wlr-randr` (no args).
- **TV native resolution:** 1360×768 landscape (768×1360 portrait).
- **Not persistent:** reboots and lightdm restarts (including `make deploy-pi`) reset to landscape. To make portrait permanent, add the rotate command to `scripts/start-chromium-kiosk.sh` before the Chromium launch.
- **The app adapts automatically** — viewport-based detection (`useOrientation`): portrait grids, compacted header, UI zoom stays 1.0.

---

## Hardware Monitoring & Maintenance

Storage and health checks for the current production Pi. These commands reference the current boot device (`/dev/sda`); update paths if the hardware changes.

### NVMe SSD Health (`smartmontools`)

`smartmontools` is installed on the Pi.

```bash
# Overall health pass/fail
ssh r4pi "sudo smartctl -H /dev/sda"

# Key health metrics
ssh r4pi "sudo smartctl -a /dev/sda | grep -E 'Percentage Used|Available Spare|Temperature|Data Units|Power_On_Hours'"

# Short self-test (runs in background, ~2 min)
ssh r4pi "sudo smartctl -t short /dev/sda"
# Then check results:
ssh r4pi "sudo smartctl -l selftest /dev/sda"
```

Current baseline (post-migration):

| Metric | Value |
|---|---|
| Model | WDC WDS500G2B0C-00PXH0 |
| Capacity | 500 GB (458 GB usable) |
| Health | PASSED |
| Percentage Used | 0% |
| Available Spare | 100% |
| Temperature | ~46 °C |

### TRIM Note

TRIM is **not supported** through the current Realtek RTL9210 USB bridge (`fstrim` reports `the discard operation is not supported`). The SSD relies on its own garbage collection. The weekly `fstrim.timer` is disabled to avoid recurring failure logs; it can be re-enabled if the bridge is replaced with one that supports TRIM (e.g., ASMedia ASM2362) or a PCIe M.2 HAT.

### Boot Medium Rollback

The original 64 GB microSD card is preserved unchanged. If the SSD fails or the Pi needs to be reverted:

1. Shut down the Pi.
2. Remove the NVMe SSD / USB adapter.
3. Reinsert the original microSD card.
4. Boot — the system will be exactly as it was before migration.

To make the SD card bootable again permanently, restore the bootloader EEPROM to SD-first (`BOOT_ORDER=0xf41`). This is usually unnecessary if the SSD is simply removed.

---

## Known Issues & Resolutions

### Auto-Hiding Chrome (Header / Sidebar / Status Bar)

All UI chrome auto-hides to maximize calendar viewing space — macOS-Dock style, driven by mouse proximity to screen edges.

- Header shows when the mouse is within 60px of the top edge; sidebar within 60px of the left edge; status bar within 60px of the bottom edge.
- Each hides 3 seconds after the mouse leaves its trigger zone, or after 3 seconds of inactivity even inside the trigger zone (so a stationary mouse on a wall-mounted display does not keep the chrome visible).
- Content reflows fluidly as each area shows/hides (in-flow layout, no overlays).
- Implemented via the generalized `useEdgeProximity({ edge })` hook.
- Sidebar reappears at its last known size state (full/collapsed) — tracked by `useSidebar`; drag handle still switches sizes.
- The status bar's old manual eye-toggle button was removed (proximity replaced it).

**Header compaction tiers (viewport width, via `useViewportWidth`):**

- `< 1300px`: compact labels — pills show initial+count only, badge count only, view switcher D/W/M/Y, Today→T, date picker auto-width.
- `< 1000px`: family pills hidden (lowest priority).
- `< 800px`: clock hidden.
- `< 640px`: weather hidden.
- `< 500px`: header date hidden.
- Logo and hamburger button were removed entirely (proximity replaced the hamburger).

### Header Consolidation

Reduced the header from 3 rows to 1 row for better space utilization.

- FamilyPills made compact (16px avatars, 11px names) and moved into header row.
- DensityBadge moved into the header (between pills and ViewSwitcher).
- StickyArea simplified to only header + optional allDaySection.
- Saves ~95px vertical space for calendar content.

### Manual Refresh Fix

Manual refresh was using cached data within a 2-minute window.

- Added `bypassCache` option to `getCalendar()` API function.
- Added `forceRefresh()` to `useCalendarEvents` hook.
- Sidebar refresh button now calls `forceRefresh()` to bypass cache.

### Date Persistence Removed

Header date stuck on the previous day after midnight (persisted in `localStorage`).

- Removed `localStorage` persistence for `currentDate`.
- `currentDate` now initializes to `new Date()` on every page load.
- View type (day/week/month/year) still persisted.
- Ensures the tablet always shows today's schedule on reload.

### Event Popup Positioning Fix

Popup flipped to the opposite side of the cursor when near the viewport edge, creating large gaps.

- Changed from flip logic to clamp logic.
- Popup now stays as close to the cursor as possible while avoiding viewport overflow.
- Uses `Math.max/min` to clamp position within bounds.

### CI Test Fixes

Tests were failing on CI due to timezone issues and missing env vars.

- Fixed timezone issues in `useCalendarEvents.test.ts` (use `new Date(year, month, day)` instead of ISO strings).
- Updated test assertions for the new `getCalendar` options parameter.
- Added `VITE_API_URL` to `vitest.config.ts` env.

### "Error: Failed to fetch" on Pi Kiosk

Pi kiosk showed "Error: Failed to fetch" after deployment.

**Root causes:**
1. Browser cached old JS bundles from previous builds.
2. Backend wasn't ready when kiosk started (race condition).
3. Network issues caused transient fetch failures.

**Solutions:**
1. **Cache-busting headers** (`nginx.conf`) — prevents browser caching of JS bundles:
   ```
   Cache-Control: no-cache, no-store, must-revalidate
   Pragma: no-cache
   Expires: 0
   ```
2. **Improved retry logic** (`api.ts`) — 5 retries with 2s base delay (2s, 4s, 8s, 16s, 32s = ~62 seconds total).
3. **Error retry interval** (`useApi.ts`) — retries every 10 seconds when in error state instead of waiting for the full polling interval.
4. **Health check before fetching** (`App.tsx`) — waits up to 30s for backend, shows "Connecting to backend..." message.
5. **Deploy with `--no-cache`** (`Makefile`) — ensures build args are always applied.

### Blank Screen After Pi Reboot

After Pi reboot, Chromium showed a blank grey screen instead of the dashboard.

**Root cause:** Chromium autostart didn't wait for the display server and backend services to be ready.

**Solutions:**
1. **Wrapper script** (`scripts/start-chromium-kiosk.sh`) — waits up to 30s for X display, 120s for backend services.
2. **Version-controlled configuration** — autostart config tracked in git, deployed automatically.
3. **Retry logic** — script retries service checks before launching Chromium.

### Weather Icon Redesign

All 15 OWM `weather.main` conditions now have unique SVG icons with day/night color variants. The old emoji-based approach was replaced with a complete icon system:
- 1:1 mapping (no grouping) — each OWM condition gets its own icon
- Day/night variants — darker colors at night, moon with stars for clear nights
- Value-aware metric icons in tooltips (temperature, humidity, wind, UV, etc.)
- Timezone-aware date conversion using OWM's `timezone_offset`

### Docker Build Cache Issue with VITE_API_URL

Docker's build cache doesn't track `ARG` instructions in the cache key. When `VITE_API_URL` changed, Docker used cached layers with the old value baked into the JS bundle.

**Solution:** `make deploy-pi` uses `--no-cache` for frontend builds to ensure build args are always applied.

### mkcert Certificate Trust on Pi

Chromium on Pi didn't trust mkcert certificates, showing certificate warnings.

**Solution:** Imported mkcert root CA into Chromium's NSS database on Pi:
```bash
certutil -d sql:/home/rpi4_main/.pki/nssdb -A -t 'C,,' -n 'mkcert' -i /tmp/rootCA.pem
```

---

## Raspberry Pi Deployment Details

### Kiosk Mode Setup

- **Browser:** Chromium with kiosk flags.
- **URL:** `https://dashy.local` (HTTPS via Traefik).
- **Auto-start:** Wrapper script (`scripts/start-chromium-kiosk.sh`) with retry logic.
- **Configuration:** Version-controlled in `scripts/chromium-kiosk.desktop`.
- **Certificate:** mkcert root CA imported into Chromium's NSS database.
- **Idle cursor hiding:** The frontend hides the mouse pointer after 2 seconds of inactivity via `useIdleCursor`, which works on both X11 and Wayland (the Pi kiosk runs labwc/Wayland). This avoids the wired mouse laser leaving a persistent pointer on the wall-mounted display.

The wrapper script ensures reliable startup by:
1. Waiting for X display to be ready (up to 30 seconds).
2. Waiting for backend services to be available (up to 120 seconds).
3. Only then launching Chromium in kiosk mode.

### Deployment Command

```bash
make deploy-pi
```

This intelligent deployment command:
1. Detects changes between last deployment and current HEAD.
2. Syncs local `main` branch.
3. Pushes to Pi (git pull on Pi).
4. Configures Chromium kiosk (copies wrapper script and autostart config).
5. Rebuilds only what changed (frontend/backend/infrastructure).
6. Restarts affected services only.
7. Verifies deployment (checks frontend and backend accessibility).
8. Records deployment commit on Pi.
9. Syncs branches (merges main into development).

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
- **Pattern:** `{project}-{service}`

### Local Domain Routing

| Service | Domain | Traefik Router |
|---------|--------|----------------|
| Frontend | `dashy.local` | `dashy-dev-frontend` |
| Backend API | `api.dashy.local` | `dashy-dev-backend` |
| API Docs | `api.dashy.local/docs` | (same as backend) |

### Environment Variables

- **File:** `env/.env.dev` (gitignored)
- **Template:** `env/.env.dev.example` (committed)
- **Key vars:** `GOOGLE_CALENDAR_ID`, `GOOGLE_SERVICE_ACCOUNT_JSON`, `OPENWEATHERMAP_API_KEY`, `WEATHER_USE_MOCK`, `FAMILY_MEMBERS`
- **Weather control:** `WEATHER_USE_MOCK=true` in development (all dev machines use mock data), `WEATHER_USE_MOCK=false` in production (Pi only, calls real API to stay within 1000 calls/day limit)

### MCP Servers

- **Context7** — installed globally via npm (`npm install -g @upstash/context7-mcp`). Provides latest package documentation and version info.
  - Configured in `~/.qwen/settings.json` under `mcpServers`
  - Use to check latest stable versions before adding dependencies
