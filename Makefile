.PHONY: help \
        sync \
        dev-up dev-down dev-logs dev-shell dev-shell-kiosk dev-restart dev-build dev-rebuild \
        migrate migrate-status migrate-check migrate-rollback migrate-create \
        db-status db-clean-chores db-clean-categories db-clean-tags db-clean-full db-reset \
        test test-kiosk test-api \
        lint lint-kiosk lint-api format format-kiosk format-api \
        typecheck typecheck-kiosk \
        build build-kiosk build-api \
        install-kiosk install-api add-kiosk add-kiosk-dev add-api remove-kiosk remove-kiosk-dev remove-api fix-kiosk-store \
        deploy deploy-status deploy-logs deploy-down deploy-restart \
        submodule-update \
        clean setup

# ==============================================================================
# HELP
# ==============================================================================

.DEFAULT_GOAL := help

help:
	@echo "Dashy - Family Calendar Dashboard (Orchestrator)"
	@echo ""
	@echo "This is the orchestrator repo. Kiosk and API are git submodules:"
	@echo "  - dashy-kiosk/ → dashy-kiosk (React + Vite)"
	@echo "  - dashy-api/   → dashy-api (FastAPI)"
	@echo ""
	@echo "📋 Quick Start:"
	@echo "  1. Setup:           make setup"
	@echo "  2. Sync repos:      make sync"
	@echo "  3. Start dev:       make dev-up"
	@echo "  4. View app:        https://dashy.local"
	@echo "  5. API docs:        https://api.dashy.local/docs"
	@echo ""
	@echo "🔧 Development:"
	@echo "  make sync                - Sync all repos (main + development, all submodules)"
	@echo "  make dev-up              - Start development environment"
	@echo "  make dev-down            - Stop development environment"
	@echo "  make dev-logs            - View development logs (follow)"
	@echo "  make dev-shell           - Shell into API container"
	@echo "  make dev-shell-kiosk     - Shell into kiosk container"
	@echo "  make dev-restart         - Restart development environment"
	@echo "  make dev-build           - Build development containers"
	@echo "  make dev-rebuild         - Rebuild containers (no cache)"
	@echo ""
	@echo "️  Database Migrations:"
	@echo "  make migrate             - Run pending migrations (also runs on dev-up)"
	@echo "  make migrate-status      - Show current migration state"
	@echo "  make migrate-check       - Check if models are in sync with migrations"
	@echo "  make migrate-rollback    - Rollback last migration"
	@echo "  make migrate-create MESSAGE=<msg> - Generate new migration from model changes"
	@echo ""
	@echo "🧹 Database Cleanup (dev only — refuses production DBs):"
	@echo "  make db-status           - Show row counts for all tables"
	@echo "  make db-clean-chores     - Truncate all chore tables (keep family/categories/tags)"
	@echo "  make db-clean-categories - Truncate chore categories"
	@echo "  make db-clean-tags       - Truncate chore tags"
	@echo "  make db-clean-full CONFIRM=1 - Truncate ALL tables (fresh start)"
	@echo "  make db-reset CONFIRM=1  - Drop & recreate database via migrations"
	@echo ""
	@echo "🧪 Testing:"
	@echo "  make test                - Run all tests"
	@echo "  make test-kiosk          - Run kiosk tests"
	@echo "  make test-api            - Run API tests"
	@echo ""
	@echo "✨ Code Quality:"
	@echo "  make lint                - Lint both kiosk + API"
	@echo "  make lint-kiosk          - Lint kiosk (ESLint)"
	@echo "  make lint-api            - Lint API (Ruff)"
	@echo "  make format              - Format both kiosk + API"
	@echo "  make format-kiosk        - Format kiosk (Prettier)"
	@echo "  make format-api          - Format API (Ruff)"
	@echo "  make typecheck           - TypeScript type check"
	@echo ""
	@echo "📦 Build:"
	@echo "  make build               - Production build both"
	@echo "  make build-kiosk         - Production build kiosk"
	@echo "  make build-api           - Production build API"
	@echo ""
	@echo "📦 Package Management:"
	@echo "  make install-kiosk       - Install kiosk dependencies (pnpm install)"
	@echo "  make install-api         - Install API dependencies (uv sync)"
	@echo "  make add-kiosk PACKAGE=<name>      - Add kiosk production dependency"
	@echo "  make add-kiosk-dev PACKAGE=<name>  - Add kiosk dev dependency"
	@echo "  make add-api PACKAGE=<name>        - Add API package"
	@echo "  make remove-kiosk PACKAGE=<name>   - Remove kiosk production dependency"
	@echo "  make remove-kiosk-dev PACKAGE=<name> - Remove kiosk dev dependency"
	@echo "  make remove-api PACKAGE=<name>     - Remove API package"
	@echo "  make fix-kiosk-store   - Fix pnpm store mismatch (if add-kiosk fails)"
	@echo ""
	@echo "🚀 Deployment:"
	@echo "  make deploy              - Deploy to Raspberry Pi (via GitHub Actions)"
	@echo "  make deploy-status       - Check Pi deployment status"
	@echo "  make deploy-logs         - View Pi deployment logs"
	@echo "  make deploy-down         - Stop Pi deployment"
	@echo "  make deploy-restart      - Restart Pi deployment"
	@echo ""
	@echo "🔧 Submodules:"
	@echo "  make submodule-update    - Pull latest submodule commits"
	@echo ""
	@echo "🛠️  Utilities:"
	@echo "  make setup               - First-time setup (create env files)"
	@echo "  make clean               - Stop and clean all environments"

# ==============================================================================
# SETUP
# ==============================================================================

setup:
	@echo "🚀 Dashy First-Time Setup"
	@echo ""
	@echo "📝 Creating env/.env.dev from template..."
	@if [ -f env/.env.dev ]; then \
		echo "  ℹ️  env/.env.dev already exists - skipping"; \
	else \
		cp env/.env.dev.example env/.env.dev; \
		echo "  ✅ Created env/.env.dev"; \
		echo "  ⚠️  Edit env/.env.dev with your actual values before running make dev-up"; \
	fi
	@echo ""
	@echo "✅ Setup complete!"

# ==============================================================================
# SYNC
# ==============================================================================

sync:
	@echo "🔄 Syncing all repositories..."
	@echo ""
	@echo "📦 Syncing orchestrator (dashy)..."
	@git checkout main 2>/dev/null && git pull origin main || echo "  ⚠️  main branch not available, skipping"
	@git checkout development 2>/dev/null && git pull origin development || echo "  ⚠️  development branch not available, skipping"
	@echo ""
	@echo "📦 Syncing dashy-kiosk submodule..."
	@cd dashy-kiosk && git checkout main 2>/dev/null && git pull origin main || echo "  ⚠️  main branch not available, skipping"
	@cd dashy-kiosk && git checkout development 2>/dev/null && git pull origin development || echo "  ⚠️  development branch not available, skipping"
	@cd dashy-kiosk && git restore . 2>/dev/null && echo "  ✅ Restored any missing files" || true
	@echo ""
	@echo "📦 Syncing dashy-api submodule..."
	@cd dashy-api && git checkout main 2>/dev/null && git pull origin main || echo "  ⚠️  main branch not available, skipping"
	@cd dashy-api && git checkout development 2>/dev/null && git pull origin development || echo "  ⚠️  development branch not available, skipping"
	@cd dashy-api && git restore . 2>/dev/null && echo "  ✅ Restored any missing files" || true
	@echo ""
	@echo "🔗 Updating submodule references..."
	@git submodule update --init --remote
	@echo ""
	@echo "✅ All repos synced to latest (main + development)"
	@echo ""
	@if docker compose -f compose/docker-compose.dev.yml ps --status running api 2>/dev/null | grep -q "dashy-dev-api"; then \
		echo "🗄️  Dev environment is running — applying any new migrations..."; \
		docker compose -f compose/docker-compose.dev.yml exec -T api uv run alembic upgrade head; \
		echo "✅ Migrations applied"; \
	else \
		echo "💡 Dev environment not running — migrations will apply on next 'make dev-up'"; \
	fi

# ==============================================================================
# DEVELOPMENT ENVIRONMENT
# ==============================================================================

dev-up: _check-traefik
	@echo "🚀 Starting DEVELOPMENT environment..."
	@docker compose -f compose/docker-compose.dev.yml up -d --build --remove-orphans
	@echo ""
	@echo "✅ Development services started!"
	@echo ""
	@echo " Access (HTTPS via Traefik):"
	@echo "   Kiosk:   https://dashy.local"
	@echo "   API:     https://api.dashy.local"
	@echo "   API Docs: https://api.dashy.local/docs"
	@echo ""
	@echo " Commands:"
	@echo "   Logs:  make dev-logs"
	@echo "   Shell: make dev-shell"

dev-down:
	@echo "🛑 Stopping DEVELOPMENT environment..."
	@docker compose -f compose/docker-compose.dev.yml down
	@echo "✅ Development stopped"

dev-logs:
	@docker compose -f compose/docker-compose.dev.yml logs -f

dev-shell:
	@docker compose -f compose/docker-compose.dev.yml exec api /bin/bash

dev-shell-kiosk:
	@docker compose -f compose/docker-compose.dev.yml exec kiosk /bin/sh

dev-restart: dev-down dev-up

dev-build:
	@echo " Building DEVELOPMENT containers..."
	@docker compose -f compose/docker-compose.dev.yml build
	@echo "✅ Development containers built"

dev-rebuild:
	@echo " Rebuilding DEVELOPMENT containers (no cache)..."
	@docker compose -f compose/docker-compose.dev.yml build --no-cache
	@docker compose -f compose/docker-compose.dev.yml up -d --remove-orphans
	@echo "✅ Development containers rebuilt"

# ==============================================================================
# DATABASE MIGRATIONS
# ==============================================================================
# Migrations run automatically on `make dev-up` via entrypoint.sh.
# These targets are for manual control: checking status, rolling back,
# or creating new migrations after model changes.

migrate:
	@echo "🗄️  Running database migrations..."
	@docker compose -f compose/docker-compose.dev.yml exec -T api uv run alembic upgrade head
	@echo "✅ Migrations complete"

migrate-status:
	@echo "🗄️  Current migration state..."
	@docker compose -f compose/docker-compose.dev.yml exec -T api uv run alembic current
	@echo ""
	@echo "Migration history:"
	@docker compose -f compose/docker-compose.dev.yml exec -T api uv run alembic history --verbose

migrate-check:
	@echo "🗄️  Checking if models are in sync with migrations..."
	@docker compose -f compose/docker-compose.dev.yml exec -T api uv run alembic check
	@echo "✅ Models and migrations are in sync"

migrate-rollback:
	@echo "⚠️  Rolling back last migration..."
	@docker compose -f compose/docker-compose.dev.yml exec -T api uv run alembic downgrade -1
	@echo "✅ Rollback complete"

migrate-create:
ifndef MESSAGE
	$(error MESSAGE is required. Usage: make migrate-create MESSAGE="describe your changes")
endif
	@echo "🗄️  Creating new migration..."
	@docker compose -f compose/docker-compose.dev.yml exec -T api uv run alembic revision --autogenerate -m "$(MESSAGE)"
	@echo "✅ Migration created in dashy-api/alembic/versions/"
	@echo ""
	@echo "⚠️  Review the generated migration file before committing!"

# ==============================================================================
# DATABASE CLEANUP (dev only)
# ==============================================================================
# All destructive targets require CONFIRM=1 to prevent accidental data loss.
# The Python script also refuses to run against production database names.

_db_cleanup:
	@docker compose -f compose/docker-compose.dev.yml exec -T api uv run python /app/scripts/db_cleanup.py $(SCOPE)

db-status:
	@echo "📊 Database row counts..."
	@$(MAKE) _db_cleanup SCOPE=status

db-clean-chores:
	@echo "🧹 Cleaning all chore data (keeping family, categories, tags)..."
	@$(MAKE) _db_cleanup SCOPE=chores

db-clean-categories:
	@echo "🧹 Cleaning chore categories..."
	@$(MAKE) _db_cleanup SCOPE=categories

db-clean-tags:
	@echo "🧹 Cleaning chore tags..."
	@$(MAKE) _db_cleanup SCOPE=tags

db-clean-full:
ifndef CONFIRM
	$(error This will TRUNCATE ALL TABLES. Add CONFIRM=1 to proceed: make db-clean-full CONFIRM=1)
endif
	@echo "⚠️  Truncating ALL tables — complete fresh start..."
	@$(MAKE) _db_cleanup SCOPE=full

db-reset:
ifndef CONFIRM
	$(error This will DROP and RECREATE the database. Add CONFIRM=1 to proceed: make db-reset CONFIRM=1)
endif
	@echo "⚠️  Dropping and recreating database..."
	@docker compose -f compose/docker-compose.dev.yml exec -T api uv run python -c "\
import os, psycopg; \
conn = psycopg.connect(host=os.environ['POSTGRES_HOST'], port=int(os.environ.get('POSTGRES_PORT','5432')), user=os.environ['POSTGRES_USER'], password=os.environ['POSTGRES_PASSWORD'], dbname='postgres', autocommit=True); \
conn.execute('DROP DATABASE IF EXISTS ' + os.environ['POSTGRES_DB']); \
conn.execute('CREATE DATABASE ' + os.environ['POSTGRES_DB']); \
conn.close(); \
print('Database dropped and recreated.')"
	@echo "🗄️  Running migrations on fresh database..."
	@docker compose -f compose/docker-compose.dev.yml exec -T api uv run alembic upgrade head
	@echo "✅ Database reset complete"

# ==============================================================================
# TESTING
# ==============================================================================

test:
	@echo "🧪 Running all tests..."
	@$(MAKE) test-kiosk
	@$(MAKE) test-api

test-kiosk:
	@echo "🧪 Running kiosk tests..."
	@docker compose -f compose/docker-compose.dev.yml exec -T kiosk pnpm run test

test-api:
	@echo " Running API tests (isolated test database)..."
	@docker compose -f compose/docker-compose.dev.yml exec -T -e POSTGRES_DB=dashy_test -e POSTGRES_USER=dashy_test -e POSTGRES_PASSWORD=test_password api uv run pytest tests/ -v

# ==============================================================================
# CODE QUALITY
# ==============================================================================

lint:
	@$(MAKE) lint-kiosk
	@$(MAKE) lint-api

lint-kiosk:
	@echo "🔍 Linting kiosk..."
	@docker compose -f compose/docker-compose.dev.yml exec -T kiosk pnpm run lint

lint-api:
	@echo "🔍 Linting API..."
	@docker compose -f compose/docker-compose.dev.yml exec -T api uv run ruff check app/ tests/

format:
	@$(MAKE) format-kiosk
	@$(MAKE) format-api

format-kiosk:
	@echo "✨ Formatting kiosk..."
	@docker compose -f compose/docker-compose.dev.yml exec -T kiosk pnpm run format

format-api:
	@echo "✨ Formatting API..."
	@docker compose -f compose/docker-compose.dev.yml exec -T api uv run ruff format app/ tests/
	@docker compose -f compose/docker-compose.dev.yml exec -T api uv run ruff check --fix app/ tests/

typecheck:
	@$(MAKE) typecheck-kiosk

typecheck-kiosk:
	@echo "🔍 TypeScript type check..."
	@docker compose -f compose/docker-compose.dev.yml exec -T kiosk pnpm run typecheck

# ==============================================================================
# BUILD
# ==============================================================================

build:
	@$(MAKE) build-kiosk
	@$(MAKE) build-api

build-kiosk:
	@echo " Building kiosk for production..."
	@docker compose -f compose/docker-compose.dev.yml exec -T kiosk pnpm run build
	@echo "✅ Kiosk built"

build-api:
	@echo "📦 Building API for production..."
	@docker compose -f compose/docker-compose.dev.yml exec -T api uv run python -m compileall app/
	@echo "✅ API built"

# ==============================================================================
# PACKAGE MANAGEMENT
# ==============================================================================

install-kiosk:
	@echo "📦 Installing kiosk dependencies..."
	@docker compose -f compose/docker-compose.dev.yml exec -T kiosk pnpm install
	@echo "✅ Kiosk dependencies installed"

install-api:
	@echo " Installing API dependencies..."
	@docker compose -f compose/docker-compose.dev.yml exec -T api uv sync
	@echo "✅ API dependencies installed"

lock-api:
	@echo "🔒 Generating API lockfile..."
	@docker compose -f compose/docker-compose.dev.yml exec -T api uv lock
	@echo "✅ API lockfile generated"

add-kiosk:
ifndef PACKAGE
	$(error PACKAGE is required. Usage: make add-kiosk PACKAGE=<package-name>)
endif
	@echo "📦 Adding $(PACKAGE) to kiosk..."
	@docker compose -f compose/docker-compose.dev.yml exec -T kiosk pnpm add $(PACKAGE)
	@echo "✅ Added $(PACKAGE) to kiosk"

add-kiosk-dev:
ifndef PACKAGE
	$(error PACKAGE is required. Usage: make add-kiosk-dev PACKAGE=<package-name>)
endif
	@echo "📦 Adding $(PACKAGE) to kiosk (dev)..."
	@docker compose -f compose/docker-compose.dev.yml exec -T kiosk pnpm add -D $(PACKAGE)
	@echo "✅ Added $(PACKAGE) to kiosk (dev)"

add-api:
ifndef PACKAGE
	$(error PACKAGE is required. Usage: make add-api PACKAGE=<package-name>)
endif
	@echo "📦 Adding $(PACKAGE) to API..."
	@docker compose -f compose/docker-compose.dev.yml exec -T api uv add $(PACKAGE)
	@echo "✅ Added $(PACKAGE) to API"

remove-kiosk:
ifndef PACKAGE
	$(error PACKAGE is required. Usage: make remove-kiosk PACKAGE=<package-name>)
endif
	@echo "🗑️  Removing $(PACKAGE) from kiosk..."
	@docker compose -f compose/docker-compose.dev.yml exec -T kiosk pnpm remove $(PACKAGE)
	@echo "✅ Removed $(PACKAGE) from kiosk"

remove-kiosk-dev:
ifndef PACKAGE
	$(error PACKAGE is required. Usage: make remove-kiosk-dev PACKAGE=<package-name>)
endif
	@echo "🗑️  Removing $(PACKAGE) from kiosk (dev)..."
	@docker compose -f compose/docker-compose.dev.yml exec -T kiosk pnpm remove $(PACKAGE)
	@echo "✅ Removed $(PACKAGE) from kiosk (dev)"

remove-api:
ifndef PACKAGE
	$(error PACKAGE is required. Usage: make remove-api PACKAGE=<package-name>)
endif
	@echo "🗑️  Removing $(PACKAGE) from API..."
	@docker compose -f compose/docker-compose.dev.yml exec -T api uv remove $(PACKAGE)
	@echo "✅ Removed $(PACKAGE) from API"

fix-kiosk-store:
	@echo "🔧 Fixing kiosk pnpm store mismatch..."
	@docker compose -f compose/docker-compose.dev.yml exec -T kiosk sh -c "rm -rf node_modules/.pnpm && pnpm install"
	@echo "✅ Kiosk pnpm store fixed"

# ==============================================================================
# DEPLOYMENT
# ==============================================================================

PI_HOST ?= r4pi
PI_DIR ?= ~/dashy

deploy:
	@echo "🚀 Deploying to Raspberry Pi..."
	@echo "   Host: $(PI_HOST)"
	@echo "   Dir:  $(PI_DIR)"
	@echo ""
	@echo "🤖 Production deployment is automated via GitHub Actions."
	@echo "   Push to 'main' branch to trigger automatic deployment."
	@echo ""
	@echo "📋 Steps:"
	@echo "   1. Commit changes in submodules (dashy-kiosk/, dashy-api/) first"
	@echo "   2. Update submodule refs in orchestrator: make submodule-update"
	@echo "   3. git add . && git commit -m 'your message'"
	@echo "   4. git push origin main"
	@echo "   5. GitHub Actions will automatically deploy to Pi"
	@echo ""
	@echo "🔧 For local testing on Pi (development only):"
	@ssh $(PI_HOST) "cd $(PI_DIR) && git pull origin development && git submodule update --init --remote && docker compose -f compose/docker-compose.dev.yml up -d --build"

deploy-status:
	@ssh $(PI_HOST) "cd $(PI_DIR) && docker compose -f compose/docker-compose.prod.yml --env-file env/.env.prod ps"

deploy-pi:
	@echo "🚀 Deploying to Raspberry Pi (production)..."
	@echo "📥 Pulling latest main branch locally..."
	@git checkout main
	@git pull origin main
	@echo "🔄 Updating submodules..."
	@git submodule update --init --remote
	@echo "🔍 Detecting changes..."
	@LAST_COMMIT=$$(ssh $(PI_HOST) "cat $(PI_DIR)/.last-deployed-commit 2>/dev/null || echo ''"); \
	if [ -z "$$LAST_COMMIT" ]; then \
		echo "📦 First deployment detected - building all services..."; \
		CHANGED="all"; \
	else \
		echo "   Comparing $$LAST_COMMIT..HEAD"; \
		CHANGED=$$(git diff --name-only $$LAST_COMMIT..HEAD 2>/dev/null || echo "all"); \
		if [ -z "$$CHANGED" ]; then \
			echo "✅ No changes detected - skipping deployment"; \
			exit 0; \
		fi; \
		INFRA_CHANGED=$$(echo "$$CHANGED" | grep -E "^(compose/|\.env|Makefile|scripts/)" || true); \
		KIOSK_CHANGED=$$(echo "$$CHANGED" | grep -E "^dashy-kiosk(/|$$)" || true); \
		API_CHANGED=$$(echo "$$CHANGED" | grep -E "^dashy-api(/|$$)" || true); \
		if [ -n "$$INFRA_CHANGED" ]; then \
			echo "🏗️  Infrastructure changes detected - full rebuild required"; \
			CHANGED="all"; \
		else \
			echo "📝 Changed files:"; \
			echo "$$CHANGED" | sed 's/^/   /'; \
			[ -n "$$KIOSK_CHANGED" ] && echo "   → Kiosk will be rebuilt"; \
			[ -n "$$API_CHANGED" ] && echo "   → API will be rebuilt"; \
		fi; \
fi; \
	echo "🔄 Pushing to Pi..."; \
	ssh $(PI_HOST) "cd $(PI_DIR) && git pull origin main && git submodule update --init --remote"; \
	echo "⚙️  Configuring Chromium kiosk..."; \
	ssh $(PI_HOST) "cp $(PI_DIR)/scripts/start-chromium-kiosk.sh ~/start-chromium-kiosk.sh && chmod +x ~/start-chromium-kiosk.sh"; \
	ssh $(PI_HOST) "mkdir -p ~/.config/autostart && cp $(PI_DIR)/scripts/chromium-kiosk.desktop ~/.config/autostart/"; \
	COMPOSE_CMD="docker compose -f compose/docker-compose.prod.yml --env-file env/.env.prod"; \
	if [ "$$CHANGED" = "all" ]; then \
		echo "🔄 Stopping all containers..."; \
		ssh $(PI_HOST) "cd $(PI_DIR) && $$COMPOSE_CMD down"; \
		echo "🔨 Building kiosk..."; \
		ssh $(PI_HOST) "cd $(PI_DIR) && $$COMPOSE_CMD build --no-cache kiosk"; \
		echo "🔨 Building API..."; \
		ssh $(PI_HOST) "cd $(PI_DIR) && $$COMPOSE_CMD build api"; \
		echo "🚀 Starting all containers..."; \
		ssh $(PI_HOST) "cd $(PI_DIR) && $$COMPOSE_CMD up -d"; \
		echo "🔄 Restarting Chromium kiosk..."; \
		ssh $(PI_HOST) "pkill -9 chromium; sleep 2; sudo systemctl restart lightdm"; \
	else \
		if [ -n "$$KIOSK_CHANGED" ]; then \
			echo "🔨 Rebuilding kiosk..."; \
			ssh $(PI_HOST) "cd $(PI_DIR) && $$COMPOSE_CMD build --no-cache kiosk"; \
			echo "🚀 Restarting kiosk..."; \
			ssh $(PI_HOST) "cd $(PI_DIR) && $$COMPOSE_CMD up -d kiosk"; \
			echo "🔄 Restarting Chromium kiosk..."; \
			ssh $(PI_HOST) "pkill -9 chromium; sleep 2; sudo systemctl restart lightdm"; \
		fi; \
		if [ -n "$$API_CHANGED" ]; then \
			echo "🔨 Rebuilding API..."; \
			ssh $(PI_HOST) "cd $(PI_DIR) && $$COMPOSE_CMD build api"; \
			echo "🚀 Restarting API..."; \
			ssh $(PI_HOST) "cd $(PI_DIR) && $$COMPOSE_CMD up -d api"; \
		fi; \
	fi; \
	echo "🔍 Verifying deployment..."; \
	ssh $(PI_HOST) "curl -sk https://dashy.local > /dev/null && echo '✅ Kiosk accessible' || echo '❌ Kiosk failed'"; \
	ssh $(PI_HOST) "curl -sk https://api.dashy.local/health > /dev/null && echo '✅ API accessible' || echo '❌ API failed'"; \
	CURRENT_COMMIT=$$(git rev-parse HEAD); \
	ssh $(PI_HOST) "echo $$CURRENT_COMMIT > $(PI_DIR)/.last-deployed-commit"; \
	echo "💾 Recorded deployment commit: $$CURRENT_COMMIT"
	@echo "🔀 Syncing development branch with main..."
	@git checkout development
	@git pull origin development
	@git merge origin/main --no-edit
	@git push origin development
	@echo "✅ Deployment complete!"
	@echo "   Kiosk: https://dashy.local"
	@echo "   API:   https://api.dashy.local"
	@echo "   Traefik: https://traefik.local:8080"

deploy-logs:
	@ssh $(PI_HOST) "cd $(PI_DIR) && docker compose -f compose/docker-compose.prod.yml --env-file env/.env.prod logs -f"

deploy-down:
	@ssh $(PI_HOST) "cd $(PI_DIR) && docker compose -f compose/docker-compose.prod.yml --env-file env/.env.prod down"

deploy-restart:
	@ssh $(PI_HOST) "cd $(PI_DIR) && docker compose -f compose/docker-compose.prod.yml --env-file env/.env.prod restart"

# ==============================================================================
# SUBMODULES
# ==============================================================================

submodule-update:
	@echo "🔄 Updating submodules..."
	@git submodule update --remote --merge
	@echo "✅ Submodules updated"

# ==============================================================================
# CLEAN
# ==============================================================================

clean:
	@echo " Cleaning all environments..."
	@docker compose -f compose/docker-compose.dev.yml down -v --remove-orphans 2>/dev/null || true
	@echo "✅ Cleaned"

# ==============================================================================
# TRAEFIK CHECK
# ==============================================================================

_check-traefik:
	@echo " Checking Traefik..."
	@if ! docker ps --filter "name=traefik" --filter "status=running" | grep -q traefik; then \
		echo "❌ Traefik is not running!"; \
		echo "   Start it with: cd ~/docker-services/traefik && make traefik-up"; \
		exit 1; \
	fi
	@if ! docker network ls --filter "name=traefik-public" | grep -q traefik-public; then \
		echo " traefik-public network not found!"; \
		echo "   Start Traefik first: cd ~/docker-services/traefik && make traefik-up"; \
		exit 1; \
	fi
	@echo "✅ Traefik is running"

# ==============================================================================
# End of Makefile
