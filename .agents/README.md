# Dashy Project Skills

This directory contains ECC skills for the Dashy orchestrator project.

## Directory Structure

```
.agents/
  skills/
    <feature-name>/          # e.g., deploy-production/, submodule-sync/
      SKILL.md
      (supporting files)
  README.md                  # This file
```

## Naming Convention

Orchestrator skills use simple feature names without suffixes.

## Current Skills

Migrated from the legacy `.qwen/skills/` directory (ECC-formatted, `origin: community`):

- `add-docker-service/` — Adding new infrastructure services to Docker Compose
- `check-ci/` — Verifying GitHub Actions CI before deploying
- `deploy-pi/` — Production deployment to Raspberry Pi
- `deploy-production/` — Production deployment workflow
- `dev-env/` — Development environment management
- `dashy-docker-ops/` — Rebuild vs restart, volumes, troubleshooting
- `makefile-patterns/` — Makefile target conventions
- `quality-gate/` — Running lint/typecheck/test/build across the stack
- `submodule-workflow/` — Working across the orchestrator and its submodules
- `sync-types/` — Detecting and resolving kiosk/API type drift
- `testing-patterns/` — Test isolation and database setup
- `verify-local/` — Verifying local dev environment before commit/deploy

## Submodule Skills

Submodule-specific skills live in their own repositories:
- **API skills:** `dashy-api/.agents/skills/`
- **Kiosk skills:** `dashy-kiosk/.agents/skills/`

This keeps concerns separated—orchestrator skills focus on cross-module coordination, API skills on backend patterns, and kiosk skills on frontend patterns.

## Skill Format

Each skill is a directory containing:

```
skill-name/
  SKILL.md                   # Markdown with usage instructions
  (optional) examples/       # Code examples or templates
  (optional) templates/      # Reusable templates
```

## Discovery

Skills are auto-discovered by ECC harnesses:
- **Claude Code:** Native discovery via `.agents/skills/`
- **Kimi Code:** Native discovery via `.agents/skills/` and `.kimi-code/skills/`
- **Qwen Code:** Via settings configuration

Invoke skills using your harness's native syntax (e.g., `/skill:<name>` in Kimi Code, `/ecc:skill-name` in Claude Code).

## Adding a New Skill

1. Create a directory under `skills/` with your skill name
2. Add a `SKILL.md` file with:
   - Clear description of what the skill does
   - When to use it
   - Step-by-step usage instructions
   - Examples if helpful
3. Add supporting files (templates, examples) as needed
4. The skill is immediately discoverable by all harnesses

## Guidelines

- Keep skills focused on orchestrator-level concerns (deployments, coordination, multi-module workflows)
- For backend-specific patterns, add skills to `dashy-api/.agents/skills/`
- For frontend-specific patterns, add skills to `dashy-kiosk/.agents/skills/`
- Document assumptions clearly (which branch, environment, etc.)
- Make skills reusable—avoid one-time instructions
