---
name: dev-env
description: Manage the Dashy Docker development environment — start, stop, restart, rebuild, shell access, logs, and troubleshooting.
---

# Development Environment

Dashy runs entirely in Docker containers. The dev environment uses `compose/docker-compose.dev.yml` with Traefik as a reverse proxy.

## Prerequisites

Traefik must be running before starting the dev environment:
```bash
cd ~/docker-services/traefik && make traefik-up
```

The `dev-up` command checks for this automatically and will fail with instructions if Traefik is not running.

## Commands

### Start
```bash
make dev-up
```
Builds and starts both frontend and backend containers. Access:
- Frontend: https://dashy.local
- Backend API: https://api.dashy.local
- API Docs (Swagger): https://api.dashy.local/docs

### Stop
```bash
make dev-down
```

### Restart
```bash
make dev-restart
```
Stops then starts (equivalent to `dev-down` followed by `dev-up`).

### Rebuild (with cache)
```bash
make dev-build
```

### Rebuild (no cache)
```bash
make dev-rebuild
```
Use this when Docker layer caching causes stale behavior — especially after dependency changes or config updates.

### Logs
```bash
make dev-logs
```
Follows logs from both containers.

### Shell access
```bash
make dev-shell            # Backend container (Python)
make dev-shell-frontend   # Frontend container (Node)
```

## Architecture

| Service | Base Image | Dev Server | Network |
|---------|-----------|------------|---------|
| Frontend | node:24-alpine | Vite dev server on port 3000 | traefik-public |
| Backend | python:3.13-slim | uvicorn with --reload | traefik-public |

Both containers volume-mount source code for hot reload.

## Traefik Integration

Dev containers use the external `traefik-public` network. Traefik handles:
- HTTPS with self-signed certificates
- Routing `dashy.local` → frontend container
- Routing `api.dashy.local` → backend container

## Troubleshooting

### "Traefik is not running"
Start Traefik first: `cd ~/docker-services/traefik && make traefik-up`

### "traefik-public network not found"
Same as above — Traefik creates this network on startup.

### Stale frontend after dependency changes
Run `make dev-rebuild` (no-cache rebuild). Docker layer caching can hide `package.json` changes.

### Backend not reloading
The backend uses `uvicorn --reload` which watches for file changes. If it stops reloading:
1. Check the container is running: `docker compose -f compose/docker-compose.dev.yml ps`
2. Restart: `make dev-restart`

### Port conflicts
Dev containers do not expose ports directly to the host — all traffic goes through Traefik. If you see port conflicts, something else is using the Traefik ports (443/80).

## Clean Slate
```bash
make clean
```
Stops all containers and removes volumes. Use when the dev environment is in a broken state and restart is not enough.
