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
Builds and starts both kiosk and API containers. Access:
- Kiosk: https://dashy.local
- API: https://api.dashy.local
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
make dev-shell        # API container (Python)
make dev-shell-kiosk  # Kiosk container (Node)
```

## Architecture

| Service | Base Image | Dev Server | Network |
|---------|-----------|------------|---------|
| Kiosk | node:24-alpine | Vite dev server on port 3000 | traefik-public |
| API | python:3.13-slim | uvicorn with --reload | traefik-public |

Both containers volume-mount source code for hot reload.

## Traefik Integration

Dev containers use the external `traefik-public` network. Traefik handles:
- HTTPS with self-signed certificates
- Routing `dashy.local` → kiosk container
- Routing `api.dashy.local` → API container

## Database Migrations

Migrations run **automatically** on `make dev-up` via `entrypoint.sh` — no manual step needed for normal development.

`make sync` also applies pending migrations if the dev environment is already running.

### Manual migration commands

| Command | Purpose |
|---------|---------|
| `make migrate` | Run pending migrations without restart |
| `make migrate-status` | Show current version + full history |
| `make migrate-check` | Verify models match migrations |
| `make migrate-rollback` | Rollback last migration |
| `make migrate-create MESSAGE="..."` | Generate new migration from model changes |

### Typical workflow when adding a new model

1. Edit SQLModel classes in `dashy-api/app/domain/.../models.py`
2. Run `make migrate-create MESSAGE="add new_table"`
3. Review generated migration in `dashy-api/alembic/versions/`
4. Run `make migrate` to apply it
5. Commit the migration file with your model changes

### Database architecture

- PostgreSQL 18 service on Docker volume `postgres-data:/var/lib/postgresql/data`
- Dev and production use separate PostgreSQL databases on separate volumes
- Tests use an isolated `dashy_test` database (configured via `POSTGRES_*` env vars in `.env.test`)
- Database connection uses `postgresql+asyncpg://` (async) and `postgresql+psycopg://` (Alembic migrations)

## Troubleshooting

### "Traefik is not running"
Start Traefik first: `cd ~/docker-services/traefik && make traefik-up`

### "traefik-public network not found"
Same as above — Traefik creates this network on startup.

### Stale kiosk after dependency changes
Run `make dev-rebuild` (no-cache rebuild). Docker layer caching can hide `package.json` changes.

### API not reloading
The API uses `uvicorn --reload` which watches for file changes. If it stops reloading:
1. Check the container is running: `docker compose -f compose/docker-compose.dev.yml ps`
2. Restart: `make dev-restart`

### Port conflicts
Dev containers do not expose ports directly to the host — all traffic goes through Traefik. If you see port conflicts, something else is using the Traefik ports (443/80).

### Migration errors ("table already exists")
Check migration state: `make migrate-status`. If the database is out of sync, try `make migrate-rollback` then `make migrate`. Only delete the database as a last resort.

## Clean Slate
```bash
make clean
```
Stops all containers and removes volumes. Use when the dev environment is in a broken state and restart is not enough.
