---
name: makefile-patterns
description: Makefile patterns for Dashy — adding targets, naming conventions, structure, best practices, keeping help text updated.
---

# Makefile Patterns

The Dashy Makefile is the single entry point for all development tasks. This skill covers patterns and conventions for adding new targets.

## When to Use

- Adding new Makefile targets
- Understanding existing Makefile structure
- Troubleshooting Makefile issues
- Ensuring consistency across targets

## Structure

The Makefile is organized into sections:

```makefile
.PHONY: help \
        sync \
        dev-up dev-down dev-logs ... \
        migrate migrate-status ... \
        test test-kiosk test-api \
        lint lint-kiosk lint-api ... \
        ...

# ==============================================================================
# HELP
# ==============================================================================

.DEFAULT_GOAL := help

help:
    @echo "Dashy - Family Calendar Dashboard (Orchestrator)"
    ...

# ==============================================================================
# SETUP
# ==============================================================================

setup:
    ...

# ==============================================================================
# SYNC
# ==============================================================================

sync:
    ...

# ... more sections
```

### Section organization

1. **HELP** — help text and quick start
2. **SETUP** — first-time setup
3. **SYNC** — repository synchronization
4. **DEVELOPMENT ENVIRONMENT** — dev-up, dev-down, etc.
5. **DATABASE MIGRATIONS** — migration commands
6. **TESTING** — test targets
7. **CODE QUALITY** — lint, format, typecheck
8. **BUILD** — production builds
9. **PACKAGE MANAGEMENT** — install, add, remove packages
10. **DEPLOYMENT** — deploy to Pi
11. **SUBMODULES** — submodule management
12. **CLEAN** — cleanup targets
13. **TRAEFIK CHECK** — internal checks

## Naming Conventions

### Target names

- **Single word:** lowercase (e.g., `setup`, `sync`, `test`)
- **Multi-word:** kebab-case (e.g., `dev-up`, `migrate-status`, `test-api`)
- **Submodule-specific:** suffix with `-kiosk` or `-api` (e.g., `lint-kiosk`, `lint-api`)
- **Internal targets:** prefix with `_` (e.g., `_check-traefik`)

### Examples

```makefile
# ✅ Good
dev-up
dev-down
migrate-status
test-api
lint-kiosk
_check-traefik

# ❌ Bad
devUp          # Not kebab-case
dev_up         # Not kebab-case
testApi        # Not kebab-case
check-traefik  # Should be internal (_check-traefik)
```

## Patterns

### Docker compose exec pattern

All commands that run inside containers follow this pattern:

```makefile
target-name:
    @echo "🔧 Doing something..."
    @docker compose -f compose/docker-compose.dev.yml exec -T <service> <command>
    @echo "✅ Done"
```

**Key elements:**
- `@` prefix suppresses command echo (cleaner output)
- `-T` flag for non-interactive execution
- Emoji for visual feedback (🔧 start, ✅ success, ❌ error, 🗄️ database, etc.)
- Echo statements for clarity

### API container commands

All API container commands must use `uv run`:

```makefile
# ✅ Correct
test-api:
    @docker compose -f compose/docker-compose.dev.yml exec -T api uv run pytest tests/ -v

lint-api:
    @docker compose -f compose/docker-compose.dev.yml exec -T api uv run ruff check app/ tests/

# ❌ Wrong (missing uv run)
test-api:
    @docker compose -f compose/docker-compose.dev.yml exec -T api pytest tests/ -v
```

### Submodule-specific targets

For targets that operate on one submodule:

```makefile
lint-kiosk:
    @echo "🔍 Linting kiosk..."
    @docker compose -f compose/docker-compose.dev.yml exec -T kiosk pnpm run lint

lint-api:
    @echo "🔍 Linting API..."
    @docker compose -f compose/docker-compose.dev.yml exec -T api uv run ruff check app/ tests/

lint:
    @$(MAKE) lint-kiosk
    @$(MAKE) lint-api
```

**Pattern:**
- Submodule-specific targets do the actual work
- Combined target calls both submodule targets
- Use `$(MAKE)` to call other targets (not `make`)

### Targets with parameters

For targets that require parameters:

```makefile
add-kiosk:
ifndef PACKAGE
    $(error PACKAGE is required. Usage: make add-kiosk PACKAGE=<package-name>)
endif
    @echo "📦 Adding $(PACKAGE) to kiosk..."
    @docker compose -f compose/docker-compose.dev.yml exec -T kiosk pnpm add $(PACKAGE)
    @echo "✅ Added $(PACKAGE) to kiosk"
```

**Pattern:**
- Check for required parameters with `ifndef`
- Provide helpful error message with usage example
- Use `$(error ...)` to fail fast

### Multi-step targets

For targets with multiple steps:

```makefile
sync:
    @echo "🔄 Syncing all repositories..."
    @echo ""
    @echo "📦 Syncing orchestrator (dashy)..."
    @git checkout main 2>/dev/null && git pull origin main || echo "  ⚠️  main branch not available, skipping"
    @git checkout development 2>/dev/null && git pull origin development || echo "  ⚠️  development branch not available, skipping"
    @echo ""
    @echo "📦 Syncing dashy-kiosk submodule..."
    @cd dashy-kiosk && git checkout main 2>/dev/null && git pull origin main || echo "  ⚠️  main branch not available, skipping"
    ...
    @echo ""
    @echo "✅ All repos synced to latest (main + development)"
```

**Pattern:**
- Echo statements for progress
- Empty `@echo ""` for spacing
- `|| echo "..."` for non-fatal errors
- Clear success message at end

### Conditional logic

For targets that check state:

```makefile
sync:
    ...
    @if docker compose -f compose/docker-compose.dev.yml ps --status running api 2>/dev/null | grep -q "dashy-dev-api"; then \
        echo "🗄️  Dev environment is running — applying any new migrations..."; \
        docker compose -f compose/docker-compose.dev.yml exec -T api uv run alembic upgrade head; \
        echo "✅ Migrations applied"; \
    else \
        echo "💡 Dev environment not running — migrations will apply on next 'make dev-up'"; \
    fi
```

**Pattern:**
- Use shell `if` for conditional logic
- Escape newlines with `\`
- Provide helpful messages for both branches

### Internal targets

For targets that should not be called directly:

```makefile
_check-traefik:
    @echo " Checking Traefik..."
    @if ! docker ps --filter "name=traefik" --filter "status=running" | grep -q traefik; then \
        echo "❌ Traefik is not running!"; \
        echo "   Start it with: cd ~/docker-services/traefik && make traefik-up"; \
        exit 1; \
    fi
    @echo "✅ Traefik is running"

dev-up: _check-traefik
    @echo "🚀 Starting DEVELOPMENT environment..."
    @docker compose -f compose/docker-compose.dev.yml up -d --build --remove-orphans
    ...
```

**Pattern:**
- Prefix with `_` to indicate internal
- Use as dependency: `dev-up: _check-traefik`
- Perform validation or setup

## Help Text

### Update help when adding targets

When adding a new target, update the help section:

```makefile
help:
    @echo "Dashy - Family Calendar Dashboard (Orchestrator)"
    @echo ""
    @echo "📋 Quick Start:"
    @echo "  1. Setup:           make setup"
    ...
    @echo ""
    @echo "🔧 Development:"
    @echo "  make sync                - Sync all repos (main + development, all submodules)"
    @echo "  make dev-up              - Start development environment"
    @echo "  make dev-down            - Stop development environment"
    ...
    @echo ""
    @echo "🗄️  Database Migrations:"
    @echo "  make migrate             - Run pending migrations (also runs on dev-up)"
    @echo "  make migrate-status      - Show current migration state"
    ...
```

**Pattern:**
- Group related targets with emoji headers
- Align descriptions with spaces
- Keep descriptions concise (< 60 chars)
- Update help immediately when adding targets

### Help format

```makefile
@echo "  make <target-name>      - <description>"
```

**Alignment:** Use spaces to align descriptions. Target names are typically 20-25 chars, then 6 spaces, then description.

## Adding New Targets

### Step-by-step

1. **Add to `.PHONY`** at the top:

```makefile
.PHONY: help \
        sync \
        dev-up dev-down ... \
        migrate migrate-status migrate-check migrate-rollback migrate-create \
        ...
```

2. **Add target implementation** in appropriate section:

```makefile
# ==============================================================================
# DATABASE MIGRATIONS
# ==============================================================================

migrate:
    @echo "🗄️  Running database migrations..."
    @docker compose -f compose/docker-compose.dev.yml exec -T api uv run alembic upgrade head
    @echo "✅ Migrations complete"
```

3. **Update help text**:

```makefile
@echo "🗄️  Database Migrations:"
@echo "  make migrate             - Run pending migrations (also runs on dev-up)"
```

4. **Test the target**:

```bash
make migrate
```

5. **Update AGENTS.md** if it's a commonly used target

### Example: Adding a new service target

```makefile
# Add to .PHONY
.PHONY: ... redis-logs redis-shell ...

# Add to help
@echo "🔧 Redis:"
@echo "  make redis-logs          - View Redis logs"
@echo "  make redis-shell         - Shell into Redis container"

# Add implementation
redis-logs:
    @echo "📋 Redis logs..."
    @docker compose -f compose/docker-compose.dev.yml logs -f redis

redis-shell:
    @docker compose -f compose/docker-compose.dev.yml exec redis redis-cli
```

## Best Practices

### Do

- ✅ Use `@` prefix for clean output
- ✅ Use emoji for visual feedback
- ✅ Use `-T` flag for non-interactive exec
- ✅ Use `uv run` for all API commands
- ✅ Update help text when adding targets
- ✅ Use `$(MAKE)` to call other targets
- ✅ Provide helpful error messages
- ✅ Test targets before committing
- ✅ Update AGENTS.md for commonly used targets

### Don't

- ❌ Run commands directly on host (use Docker)
- ❌ Forget `uv run` for API commands
- ❌ Skip help text updates
- ❌ Use `make` to call other targets (use `$(MAKE)`)
- ❌ Hardcode paths or values
- ❌ Forget to add to `.PHONY`
- ❌ Use inconsistent naming (stick to kebab-case)
- ❌ Leave debug echo statements

## Troubleshooting

### "No rule to make target"

**Cause:** Target not defined or typo in name

**Fix:** Check target name spelling, ensure it's in the Makefile

### "uv: command not found"

**Cause:** Running command on host instead of in container

**Fix:** Use `docker compose exec` to run inside container

### Target runs but nothing happens

**Cause:** Missing `@` prefix causing command echo to interfere

**Fix:** Add `@` prefix to commands

### Help text is misaligned

**Cause:** Inconsistent spacing

**Fix:** Use spaces (not tabs) for alignment in help text

## Related Skills

- **dev-env** — development environment management
- **testing-patterns** — test isolation and database setup
- **docker-patterns** — Docker troubleshooting and patterns
- **quality-gate** — running tests and linting
