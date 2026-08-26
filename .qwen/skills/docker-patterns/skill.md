---
name: docker-patterns
description: Docker patterns for Dashy — when to rebuild vs restart, volume management, common issues, troubleshooting, dev vs prod differences.
---

# Docker Patterns

Dashy runs entirely in Docker containers. This skill covers common patterns, troubleshooting, and best practices for working with the Docker setup.

## When to Use

- Troubleshooting container issues
- Understanding when to rebuild vs restart
- Managing volumes and persistent data
- Debugging network or port conflicts
- Understanding dev vs prod differences

## Rebuild vs Restart

### Restart (fast, preserves state)

```bash
make dev-restart
```

**When to use:**
- Code changes (hot reload should pick them up, but restart if it doesn't)
- Configuration changes in `.env.dev`
- Container is hung or unresponsive
- Network issues between containers

**What it does:**
- Stops containers (`docker compose down`)
- Starts containers (`docker compose up -d`)
- Preserves volumes (database, node_modules, etc.)
- Fast (~5 seconds)

### Rebuild with cache (medium, preserves dependencies)

```bash
make dev-build
```

**When to use:**
- After adding new dependencies to `package.json` or `pyproject.toml`
- After changing Dockerfile
- When restart doesn't pick up changes

**What it does:**
- Rebuilds images using Docker cache
- Faster than no-cache rebuild
- Preserves downloaded packages in cache

### Rebuild without cache (slow, clean slate)

```bash
make dev-rebuild
```

**When to use:**
- Dependency resolution issues ("package not found")
- Stale Docker layers causing weird behavior
- After major dependency updates
- When `dev-build` doesn't fix the issue

**What it does:**
- Rebuilds images with `--no-cache`
- Downloads all dependencies fresh
- Slow (~2-5 minutes)
- Use as last resort before `make clean`

### Clean (destructive, removes everything)

```bash
make clean
```

**When to use:**
- Database corruption
- Volume issues
- When rebuild doesn't fix the issue
- Starting completely fresh

**What it does:**
- Stops all containers
- Removes containers, networks, and **volumes**
- **Database is deleted** — use `make migrate-rollback` instead if possible
- Next `make dev-up` will recreate everything from scratch

## Volume Management

### What persists

| Volume | Path | Purpose | Survives rebuild? |
|--------|------|---------|-------------------|
| `postgres-data` | `/var/lib/postgresql/data` | PostgreSQL database | ✅ Yes |
| `redis-data` | `/data` | Redis cache | ✅ Yes |
| Source code | `/app` | Bind mount from host | ✅ Yes (host files) |
| `node_modules` | `/app/node_modules` | Kiosk dependencies | ✅ Yes (anonymous volume) |

### Database persistence

The dev database lives on the `postgres-data` volume at `/var/lib/postgresql/data`. It persists across:
- Container restarts (`make dev-restart`)
- Image rebuilds (`make dev-build`, `make dev-rebuild`)
- System reboots

It is **deleted** by:
- `make clean` (removes volumes)
- Manual `docker volume rm dashy-dev-postgres-data`

### Viewing volume contents

```bash
# List volumes
docker volume ls | grep dashy

# Inspect volume mount point
docker volume inspect dashy-dev-postgres-data

# Access volume contents (temporary container)
docker run --rm -v dashy-dev-postgres-data:/data alpine ls -la /data
```

### Backing up the database

```bash
# Copy database from volume (pg_dump)
docker compose -f compose/docker-compose.dev.yml exec -T postgres pg_dump -U dashy dashy > backup.sql

# Restore from backup
docker compose -f compose/docker-compose.dev.yml exec -T postgres psql -U dashy dashy < backup.sql
```

## Common Issues

### "Traefik is not running"

**Symptom:** `make dev-up` fails with "Traefik is not running"

**Cause:** Traefik reverse proxy is not running

**Fix:**
```bash
cd ~/docker-services/traefik && make traefik-up
```

**Why:** Dashy dev containers use Traefik for HTTPS and routing. Traefik must be running first.

### "traefik-public network not found"

**Symptom:** Container fails to start with network error

**Cause:** Traefik creates the `traefik-public` network on startup

**Fix:** Same as above — start Traefik first

### Stale kiosk after dependency changes

**Symptom:** Kiosk doesn't pick up new dependencies after `pnpm add`

**Cause:** Docker layer caching hides `package.json` changes

**Fix:**
```bash
make dev-rebuild  # No-cache rebuild
```

**Why:** Docker caches each layer. If `package.json` changes but the layer hash doesn't, Docker uses the cached layer.

### API not reloading

**Symptom:** API doesn't pick up code changes

**Cause:** `uvicorn --reload` watcher stopped or missed changes

**Fix:**
```bash
make dev-restart
```

**Why:** Uvicorn's file watcher can miss changes if files are modified too quickly or if there are permission issues.

### Port conflicts

**Symptom:** "Port 443 already in use" or "Port 80 already in use"

**Cause:** Something else is using Traefik's ports

**Fix:**
```bash
# Find what's using the port
sudo lsof -i :443
sudo lsof -i :80

# Stop the conflicting service, or change Traefik's ports
```

**Why:** Dev containers don't expose ports directly — all traffic goes through Traefik on ports 80/443.

### "table already exists" migration error

**Symptom:** API crashes on startup with "table chore_categories already exists"

**Cause:** Database is in inconsistent state (tables exist but migration not recorded)

**Fix:**
```bash
# Check migration state
make migrate-status

# Try rollback then re-apply
make migrate-rollback
make migrate

# If that fails, check PostgreSQL state
# Only as last resort: recreate database volume
# docker compose -f compose/docker-compose.dev.yml down -v
# make dev-up
```

**Why:** This happens when `create_db_and_tables()` was called (creates tables) but Alembic migrations weren't run (doesn't record in `alembic_version` table).

### Container won't start

**Symptom:** Container exits immediately or crashes on startup

**Debug steps:**
```bash
# Check logs
docker compose -f compose/docker-compose.dev.yml logs api

# Check if container is running
docker compose -f compose/docker-compose.dev.yml ps

# Shell into container (if it starts but crashes)
docker compose -f compose/docker-compose.dev.yml run --rm api /bin/bash

# Check health
docker inspect --format='{{.State.Health.Status}}' dashy-dev-api
```

### Network issues between containers

**Symptom:** API can't connect to Redis, or kiosk can't reach API

**Cause:** Containers not on same network, or DNS resolution issue

**Fix:**
```bash
# Check networks
docker network ls | grep dashy

# Inspect container networks
docker inspect dashy-dev-api | grep -A 20 "Networks"

# Restart network
docker compose -f compose/docker-compose.dev.yml down
docker compose -f compose/docker-compose.dev.yml up -d
```

## Dev vs Prod Differences

### Development (`docker-compose.dev.yml`)

- **Hot reload:** Vite dev server (kiosk), uvicorn --reload (API)
- **Source mounts:** Code bind-mounted from host for live editing
- **Mock data:** `WEATHER_USE_MOCK=true`, `CALENDAR_USE_MOCK=true`
- **Database:** PostgreSQL on Docker volume
- **Traefik:** Self-signed certificates, `dashy.local` domain
- **Logging:** Verbose, development-friendly

### Production (`docker-compose.prod.yml`)

- **Static builds:** Vite build output (kiosk), uvicorn without --reload (API)
- **No source mounts:** Code baked into images
- **Real data:** `WEATHER_USE_MOCK=false`, `CALENDAR_USE_MOCK=false`
- **Database:** PostgreSQL on Docker volume (separate from dev)
- **Traefik:** Real certificates (Let's Encrypt), production domain
- **Logging:** Structured, production-ready

### Environment variables

| Variable | Dev | Prod |
|----------|-----|------|
| `ENVIRONMENT` | `development` | `production` |
| `WEATHER_USE_MOCK` | `true` | `false` |
| `CALENDAR_USE_MOCK` | `true` | `false` |
| `CHORES_USE_MOCK` | `true` | `false` |
| `POSTGRES_HOST` | `postgres` | `postgres` (separate volume) |

## docker compose exec Patterns

### Running commands in containers

All API container commands must use `uv run` prefix:

```bash
# ✅ Correct
docker compose -f compose/docker-compose.dev.yml exec -T api uv run pytest tests/ -v
docker compose -f compose/docker-compose.dev.yml exec -T api uv run ruff check app/
docker compose -f compose/docker-compose.dev.yml exec -T api uv run python -c "print('hello')"

# ❌ Wrong (missing uv run)
docker compose -f compose/docker-compose.dev.yml exec -T api pytest tests/ -v
docker compose -f compose/docker-compose.dev.yml exec -T api ruff check app/
docker compose -f compose/docker-compose.dev.yml exec -T api python -c "print('hello')"
```

**Why:** `uv run` ensures the correct Python environment and dependencies are used. Without it, you might use the system Python or wrong virtualenv.

### Interactive vs non-interactive

```bash
# Interactive (for shell access)
docker compose -f compose/docker-compose.dev.yml exec api /bin/bash

# Non-interactive (for scripts, CI)
docker compose -f compose/docker-compose.dev.yml exec -T api uv run pytest tests/ -v
```

**When to use `-T`:**
- In Makefile targets
- In scripts
- In CI/CD
- When you don't need interactive input

**When to omit `-T`:**
- Manual debugging
- When you need to interact with the command
- Shell access (`/bin/bash`)

## Troubleshooting Checklist

When something isn't working:

- [ ] Traefik is running (`docker ps | grep traefik`)
- [ ] Containers are running (`docker compose -f compose/docker-compose.dev.yml ps`)
- [ ] Logs show no errors (`docker compose -f compose/docker-compose.dev.yml logs api`)
- [ ] Database migrations are up to date (`make migrate-status`)
- [ ] Environment variables are correct (`docker compose -f compose/docker-compose.dev.yml exec api env`)
- [ ] Network connectivity is working (`docker compose -f compose/docker-compose.dev.yml exec api curl http://redis:6379`)
- [ ] Volumes are mounted correctly (`docker inspect dashy-dev-api | grep Mounts -A 10`)

## Related Skills

- **dev-env** — development environment management
- **quality-gate** — running tests and linting
- **testing-patterns** — test isolation and database setup
- **add-docker-service** — adding new infrastructure services
