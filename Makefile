.PHONY: help \
        dev-up dev-down dev-logs dev-shell dev-shell-frontend dev-restart dev-build dev-rebuild \
        test-up test-down test-logs test-shell test-build test-rebuild test test-frontend test-backend \
        lint lint-frontend lint-backend format format-frontend format-backend \
        typecheck typecheck-frontend \
        build build-frontend build-backend \
        install-frontend install-backend add-frontend add-backend remove-frontend remove-backend \
        deploy deploy-status deploy-logs deploy-down deploy-restart \
        clean setup

# ==============================================================================
# HELP
# ==============================================================================

.DEFAULT_GOAL := help

help:
	@echo " Dashy - Family Calendar Dashboard"
	@echo ""
	@echo "📋 Quick Start:"
	@echo "  1. Setup:           make setup"
	@echo "  2. Start dev:       make dev-up"
	@echo "  3. View app:        http://localhost:3000"
	@echo "  4. API docs:        http://localhost:8000/docs"
	@echo ""
	@echo " Development:"
	@echo "  make dev-up              - Start development environment"
	@echo "  make dev-down            - Stop development environment"
	@echo "  make dev-logs            - View development logs (follow)"
	@echo "  make dev-shell           - Shell into backend container"
	@echo "  make dev-shell-frontend  - Shell into frontend container"
	@echo "  make dev-restart         - Restart development environment"
	@echo "  make dev-build           - Build development containers"
	@echo "  make dev-rebuild         - Rebuild containers (no cache)"
	@echo ""
	@echo "🧪 Testing:"
	@echo "  make test-up             - Start test environment"
	@echo "  make test-down           - Stop test environment"
	@echo "  make test                - Run all tests"
	@echo "  make test-frontend       - Run frontend tests"
	@echo "  make test-backend        - Run backend tests"
	@echo ""
	@echo "✨ Code Quality:"
	@echo "  make lint                - Lint both frontend + backend"
	@echo "  make lint-frontend       - Lint frontend (ESLint)"
	@echo "  make lint-backend        - Lint backend (Ruff)"
	@echo "  make format              - Format both frontend + backend"
	@echo "  make format-frontend     - Format frontend (Prettier)"
	@echo "  make format-backend      - Format backend (Ruff)"
	@echo "  make typecheck           - TypeScript type check"
	@echo ""
	@echo "📦 Build:"
	@echo "  make build               - Production build both"
	@echo "  make build-frontend      - Production build frontend"
	@echo "  make build-backend       - Production build backend"
	@echo ""
	@echo "📦 Package Management:"
	@echo "  make install-frontend    - Install frontend dependencies (npm install)"
	@echo "  make install-backend     - Install backend dependencies (uv sync)"
	@echo "  make add-frontend PACKAGE=<name>  - Add frontend package"
	@echo "  make add-backend PACKAGE=<name>   - Add backend package"
	@echo "  make remove-frontend PACKAGE=<name>  - Remove frontend package"
	@echo "  make remove-backend PACKAGE=<name>   - Remove backend package"
	@echo ""
	@echo "🚀 Deployment:"
	@echo "  make deploy              - Deploy to Raspberry Pi (via GitHub Actions)"
	@echo "  make deploy-status       - Check Pi deployment status"
	@echo "  make deploy-logs         - View Pi deployment logs"
	@echo "  make deploy-down         - Stop Pi deployment"
	@echo "  make deploy-restart      - Restart Pi deployment"
	@echo ""
	@echo " Utilities:"
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
# DEVELOPMENT ENVIRONMENT
# ==============================================================================

dev-up: _check-traefik
	@echo "🚀 Starting DEVELOPMENT environment..."
	@docker compose -f compose/docker-compose.dev.yml up -d --build --remove-orphans
	@echo ""
	@echo "✅ Development services started!"
	@echo ""
	@echo " Access (HTTPS via Traefik):"
	@echo "   Frontend:  https://dashy.local"
	@echo "   Backend:   https://api.dashy.local"
	@echo "   API Docs:  https://api.dashy.local/docs"
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
	@docker compose -f compose/docker-compose.dev.yml exec backend /bin/bash

dev-shell-frontend:
	@docker compose -f compose/docker-compose.dev.yml exec frontend /bin/sh

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
# TESTING
# ==============================================================================

test-up:
	@echo " Starting TEST environment..."
	@docker compose -f compose/docker-compose.test.yml up -d --build --remove-orphans
	@echo "✅ Test services started"

test-down:
	@echo " Stopping TEST environment..."
	@docker compose -f compose/docker-compose.test.yml down
	@echo "✅ Test stopped"

test-logs:
	@docker compose -f compose/docker-compose.test.yml logs -f

test-shell:
	@docker compose -f compose/docker-compose.test.yml exec backend /bin/bash

test-build:
	@docker compose -f compose/docker-compose.test.yml build

test-rebuild:
	@docker compose -f compose/docker-compose.test.yml build --no-cache
	@docker compose -f compose/docker-compose.test.yml up -d --remove-orphans

test:
	@echo "🧪 Running all tests..."
	@$(MAKE) test-frontend
	@$(MAKE) test-backend

test-frontend:
	@echo "🧪 Running frontend tests..."
	@docker compose -f compose/docker-compose.dev.yml exec -T frontend npm run test

test-backend:
	@echo "🧪 Running backend tests..."
	@docker compose -f compose/docker-compose.dev.yml exec -T backend uv run pytest -v

# ==============================================================================
# CODE QUALITY
# ==============================================================================

lint:
	@$(MAKE) lint-frontend
	@$(MAKE) lint-backend

lint-frontend:
	@echo "🔍 Linting frontend..."
	@docker compose -f compose/docker-compose.dev.yml exec -T frontend npm run lint

lint-backend:
	@echo "🔍 Linting backend..."
	@docker compose -f compose/docker-compose.dev.yml exec -T backend uv run ruff check app/ tests/

format:
	@$(MAKE) format-frontend
	@$(MAKE) format-backend

format-frontend:
	@echo "✨ Formatting frontend..."
	@docker compose -f compose/docker-compose.dev.yml exec -T frontend npm run format

format-backend:
	@echo "✨ Formatting backend..."
	@docker compose -f compose/docker-compose.dev.yml exec -T backend uv run ruff format app/ tests/
	@docker compose -f compose/docker-compose.dev.yml exec -T backend uv run ruff check --fix app/ tests/

typecheck:
	@$(MAKE) typecheck-frontend

typecheck-frontend:
	@echo "🔍 TypeScript type check..."
	@docker compose -f compose/docker-compose.dev.yml exec -T frontend npm run typecheck

# ==============================================================================
# BUILD
# ==============================================================================

build:
	@$(MAKE) build-frontend
	@$(MAKE) build-backend

build-frontend:
	@echo " Building frontend for production..."
	@docker compose -f compose/docker-compose.dev.yml exec -T frontend npm run build
	@echo "✅ Frontend built"

build-backend:
	@echo "📦 Building backend for production..."
	@docker compose -f compose/docker-compose.dev.yml exec -T backend uv run python -m compileall app/
	@echo "✅ Backend built"

# ==============================================================================
# PACKAGE MANAGEMENT
# ==============================================================================

install-frontend:
	@echo "📦 Installing frontend dependencies..."
	@docker compose -f compose/docker-compose.dev.yml exec -T frontend npm install
	@echo "✅ Frontend dependencies installed"

install-backend:
	@echo " Installing backend dependencies..."
	@docker compose -f compose/docker-compose.dev.yml exec -T backend uv sync
	@echo "✅ Backend dependencies installed"

lock-backend:
	@echo "🔒 Generating backend lockfile..."
	@docker compose -f compose/docker-compose.dev.yml exec -T backend uv lock
	@echo "✅ Backend lockfile generated"

add-frontend:
ifndef PACKAGE
	$(error PACKAGE is required. Usage: make add-frontend PACKAGE=<package-name>)
endif
	@echo "📦 Adding $(PACKAGE) to frontend..."
	@docker compose -f compose/docker-compose.dev.yml exec -T frontend npm install $(PACKAGE)
	@echo "✅ Added $(PACKAGE) to frontend"

add-backend:
ifndef PACKAGE
	$(error PACKAGE is required. Usage: make add-backend PACKAGE=<package-name>)
endif
	@echo "📦 Adding $(PACKAGE) to backend..."
	@docker compose -f compose/docker-compose.dev.yml exec -T backend uv add $(PACKAGE)
	@echo "✅ Added $(PACKAGE) to backend"

remove-frontend:
ifndef PACKAGE
	$(error PACKAGE is required. Usage: make remove-frontend PACKAGE=<package-name>)
endif
	@echo "🗑️  Removing $(PACKAGE) from frontend..."
	@docker compose -f compose/docker-compose.dev.yml exec -T frontend npm uninstall $(PACKAGE)
	@echo "✅ Removed $(PACKAGE) from frontend"

remove-backend:
ifndef PACKAGE
	$(error PACKAGE is required. Usage: make remove-backend PACKAGE=<package-name>)
endif
	@echo "🗑️  Removing $(PACKAGE) from backend..."
	@docker compose -f compose/docker-compose.dev.yml exec -T backend uv remove $(PACKAGE)
	@echo "✅ Removed $(PACKAGE) from backend"

# ==============================================================================
# DEPLOYMENT
# ==============================================================================

PI_HOST ?= rpi4_main@dashy.local
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
	@echo "   1. git add . && git commit -m 'your message'"
	@echo "   2. git push origin main"
	@echo "   3. GitHub Actions will automatically deploy to Pi"
	@echo ""
	@echo " For local testing on Pi (development only):"
	@ssh $(PI_HOST) "cd $(PI_DIR) && git pull origin development && docker compose -f compose/docker-compose.dev.yml up -d --build"

deploy-status:
	@ssh $(PI_HOST) "cd $(PI_DIR) && docker compose -f compose/docker-compose.prod.yml ps"

deploy-pi:
	@echo "🚀 Deploying to Raspberry Pi (production)..."
	@ssh $(PI_HOST) "cd $(PI_DIR) && git pull origin main"
	@ssh $(PI_HOST) "cd $(PI_DIR) && docker compose -f compose/docker-compose.prod.yml down"
	@ssh $(PI_HOST) "cd $(PI_DIR) && docker compose -f compose/docker-compose.prod.yml up -d --build"
	@echo "🔄 Restarting Chromium kiosk..."
	@ssh $(PI_HOST) "sudo systemctl restart lightdm"
	@echo "✅ Deployment complete!"
	@echo "   Frontend: https://dashy.local"
	@echo "   Backend:  https://api.dashy.local"
	@echo "   Traefik:  https://traefik.local:8080"

deploy-logs:
	@ssh $(PI_HOST) "cd $(PI_DIR) && docker compose -f compose/docker-compose.prod.yml logs -f"

deploy-down:
	@ssh $(PI_HOST) "cd $(PI_DIR) && docker compose -f compose/docker-compose.prod.yml down"

deploy-restart:
	@ssh $(PI_HOST) "cd $(PI_DIR) && docker compose -f compose/docker-compose.prod.yml restart"

# ==============================================================================
# CLEAN
# ==============================================================================

clean:
	@echo " Cleaning all environments..."
	@docker compose -f compose/docker-compose.dev.yml down -v --remove-orphans 2>/dev/null || true
	@docker compose -f compose/docker-compose.test.yml down -v --remove-orphans 2>/dev/null || true
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
