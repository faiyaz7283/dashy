# Dashy Kiosk

Frontend for the Dashy Family Calendar Dashboard — a wall-mounted kiosk display for family schedules and weather.

## Overview

Dashy Kiosk is a React + Vite single-page application designed for full-viewport display on a Raspberry Pi kiosk. It shows family calendar events, weather data, and time — all scaled fluidly to fit any display.

## Tech Stack

- **Framework:** React 19
- **Language:** TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS 4
- **Package Manager:** pnpm
- **Testing:** Vitest + React Testing Library
- **Linting:** ESLint + Prettier
- **Deployment:** Docker (Vite build → nginx)

## Development

This repo is designed to run as part of the Dashy orchestrator (docker compose). See the [main dashy repo](https://github.com/faiyaz7283/dashy) for full setup instructions.

### Quick Start

```bash
# From the orchestrator repo (dashy/)
make dev-up

# Frontend: https://dashy.local
```

### Standalone Development

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm run dev
```

### Code Quality

```bash
make lint        # ESLint
make format      # Prettier
make typecheck   # TypeScript type check
make test        # Run vitest
make build       # Production build
```

## Architecture

```
src/
├── main.tsx              # Entry point
├── App.tsx               # Root component
├── index.css             # Global styles
├── domain/               # Domain types, utilities (calendar, family, weather)
├── features/             # Feature modules (weather, calendar, navigation, dashboard, kiosk)
├── shared/               # Shared components, hooks, api, config, services, utils
├── test/                 # Test utilities
├── theme/                # Design tokens, scaling system
├── types/                # TypeScript type definitions
└── docs/                 # Documentation
```

**Key patterns:**
- **Fluid full-viewport layout** — scales to any display via `useUiScale`
- **Feature-based organization** — each feature is self-contained
- **Domain-driven** — domain types separate from UI concerns
- **No emojis** — SVG icons only

## Design Principles

- **Fluid scaling** — fills the visible window on any display, no scrollbars
- **Floating layers** — modals portal to `document.body` with scale factor
- **Configurable** — family members, colors, API URLs from environment
- **No hardcoded viewport assumptions** — responsive to any screen size

## Deployment

This repo deploys as a Docker container via the orchestrator:

```bash
# From orchestrator repo
make deploy  # Deploys to Raspberry Pi via GitHub Actions
```

## Related Repos

- **[dashy](https://github.com/faiyaz7283/dashy)** — Orchestrator repo (compose, docs, deployment)
- **[dashy-api](https://github.com/faiyaz7283/dashy-api)** — Backend API

## License

MIT
