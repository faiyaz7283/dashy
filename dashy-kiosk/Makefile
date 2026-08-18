.PHONY: help \
        dev test lint format typecheck build \
        install add remove

.DEFAULT_GOAL := help

help:
	@echo "Dashy Kiosk - Frontend Development"
	@echo ""
	@echo "Development:"
	@echo "  make dev                 - Start Vite dev server"
	@echo ""
	@echo "Code Quality:"
	@echo "  make lint                - Lint with ESLint"
	@echo "  make format              - Format with Prettier"
	@echo "  make typecheck           - TypeScript type check"
	@echo ""
	@echo "Testing:"
	@echo "  make test                - Run vitest"
	@echo ""
	@echo "Build:"
	@echo "  make build               - Production build"
	@echo ""
	@echo "Package Management:"
	@echo "  make install             - Install dependencies (pnpm install)"
	@echo "  make add PACKAGE=<name>  - Add a package"
	@echo "  make remove PACKAGE=<name> - Remove a package"

# ==============================================================================
# DEVELOPMENT
# ==============================================================================

dev:
	@echo "Starting Vite dev server..."
	@pnpm run dev

# ==============================================================================
# CODE QUALITY
# ==============================================================================

lint:
	@echo "Linting frontend..."
	@pnpm run lint

format:
	@echo "Formatting frontend..."
	@pnpm run format

typecheck:
	@echo "Type checking frontend..."
	@pnpm run typecheck

# ==============================================================================
# TESTING
# ==============================================================================

test:
	@echo "Running frontend tests..."
	@pnpm run test

# ==============================================================================
# BUILD
# ==============================================================================

build:
	@echo "Building frontend for production..."
	@pnpm run build
	@echo "Frontend built successfully"

# ==============================================================================
# PACKAGE MANAGEMENT
# ==============================================================================

install:
	@echo "Installing frontend dependencies..."
	@pnpm install
	@echo "Dependencies installed"

add:
ifndef PACKAGE
	$(error PACKAGE is required. Usage: make add PACKAGE=<package-name>)
endif
	@echo "Adding $(PACKAGE)..."
	@pnpm add $(PACKAGE)
	@echo "Added $(PACKAGE)"

remove:
ifndef PACKAGE
	$(error PACKAGE is required. Usage: make remove PACKAGE=<package-name>)
endif
	@echo "Removing $(PACKAGE)..."
	@pnpm remove $(PACKAGE)
	@echo "Removed $(PACKAGE)"
