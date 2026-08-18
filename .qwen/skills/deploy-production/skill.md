---
name: deploy-production
description: Full production deployment flow — quality gates, verification, CI checks, multi-repo commits, merge to main, deploy to Pi. Handles any combination of changes (kiosk, api, orchestrator).
---

# Deploy to Production

Complete production deployment workflow that handles any combination of changes across the three repos (dashy-kiosk, dashy-api, orchestrator).

## When to Use

When you want to push changes to production and deploy to the Pi kiosk. This is the "full flow" — a single entry point that bundles quality gates, verification, CI checks, multi-repo commits, merge to main, and deploy.

## Usage

Say "deploy to production" or invoke `/deploy-production`.

## Workflow

### Step 1: Detect Changes

Check which repos have uncommitted changes OR have development ahead of main:

```bash
# Orchestrator
git status --short
git log main..development --oneline

# dashy-kiosk
cd dashy-kiosk && git status --short && git log main..development --oneline && cd ..

# dashy-api
cd dashy-api && git status --short && git log main..development --oneline && cd ..
```

**Logic:**
- Track two types of changes for each repo:
  - `KIOSK_UNCOMMITTED` / `KIOSK_AHEAD_OF_MAIN`
  - `API_UNCOMMITTED` / `API_AHEAD_OF_MAIN`
  - `ORCH_UNCOMMITTED` / `ORCH_AHEAD_OF_MAIN`
- If any flag is true → proceed with deployment
- If all flags are false → abort with "nothing to deploy"
- Uncommitted changes need quality gates and commits
- Changes already on development (ahead of main) skip quality gates and commits, go straight to merge

### Step 2: Quality Gates (uncommitted changes only)

**Only run quality gates if there are uncommitted changes. Skip if changes are already committed to development.**

**If dashy-kiosk has uncommitted changes:**
```bash
cd dashy-kiosk
pnpm lint && pnpm typecheck && pnpm test && pnpm build
cd ..
```

**If dashy-api has uncommitted changes:**
```bash
cd dashy-api
uv run ruff check app/ tests/ && uv run python -m compileall app/ && uv run pytest tests/ -v
cd ..
```

**If orchestrator has uncommitted changes:**
```bash
make lint && make typecheck && make test && make build
```

**Abort if any quality gate fails. Report the exact error.**

### Step 3: Verify Locally

Check containers are running and endpoints respond:

```bash
docker ps --filter "name=dashy-dev" --format "table {{.Names}}\t{{.Status}}"
curl -sk https://api.dashy.local/health
curl -sk https://dashy.local -o /dev/null -w "%{http_code}"
```

**Abort if verification fails.**

### Step 4: Commit and Push (uncommitted changes only)

**Only commit if there are uncommitted changes. Skip if changes are already on development.**

**Order matters:** Submodules first, then orchestrator.

**If dashy-kiosk has uncommitted changes:**
```bash
cd dashy-kiosk
git add .
git commit -m "descriptive message"
git push origin development
cd ..
```

**If dashy-api has uncommitted changes:**
```bash
cd dashy-api
git add .
git commit -m "descriptive message"
git push origin development
cd ..
```

**If orchestrator has uncommitted changes OR submodules were updated:**
```bash
# Update submodule refs if submodules changed
git add dashy-kiosk/ dashy-api/

# Stage all orchestrator changes
git add .

# Commit with descriptive message
git commit -m "descriptive message"

# Push
git push origin development
```

### Step 5: Check CI

Wait for GitHub Actions to pass on `development`:

```bash
gh run list --limit 5
gh run watch <run-id>
```

**Abort if CI fails. Report the failing step.**

### Step 6: Merge to Main

**Merge any repo where development is ahead of main.**

**If dashy-kiosk development is ahead of main:**
```bash
cd dashy-kiosk
git checkout main && git pull origin main
git merge development --no-edit
git push origin main
git checkout development
cd ..
```

**If dashy-api development is ahead of main:**
```bash
cd dashy-api
git checkout main && git pull origin main
git merge development --no-edit
git push origin main
git checkout development
cd ..
```

**If orchestrator development is ahead of main:**
```bash
git checkout main && git pull origin main
git merge development --no-edit
git push origin main
git checkout development
```

### Step 7: Deploy to Pi

```bash
make deploy-pi
```

This handles: pull main on Pi, update submodules, detect changes, selective rebuild, restart services, verify deployment.

## Abort Conditions

The skill stops immediately at any of these:

1. **No changes detected** — no uncommitted changes and development is not ahead of main in any repo
2. **Quality gate fails** — fix issues, re-run
3. **Local verification fails** — debug locally, re-run
4. **CI fails** — fix issues, push, re-run
5. **Merge conflict** — resolve manually, re-run
6. **Deploy fails** — check Pi logs, debug, re-run

## Examples

### Only kiosk changed (uncommitted)
- Quality gate: kiosk only
- Commit: kiosk → orchestrator (refs update)
- CI → merge kiosk + orchestrator → deploy

### Only api changed (uncommitted)
- Quality gate: api only
- Commit: api → orchestrator (refs update)
- CI → merge api + orchestrator → deploy

### Only orchestrator changed (uncommitted)
- Quality gate: orchestrator only
- Commit: orchestrator
- CI → merge orchestrator → deploy

### All three changed (uncommitted)
- Quality gate: all three
- Commit: kiosk → api → orchestrator (refs + changes)
- CI → merge all three → deploy

### Changes already on development (ahead of main)
- No quality gates needed (already passed)
- No commits needed (already pushed)
- Skip to CI check → merge → deploy

### Mixed: some uncommitted, some ahead of main
- Quality gates: only for repos with uncommitted changes
- Commits: only for repos with uncommitted changes
- CI: wait for all repos
- Merge: all repos where development is ahead of main

## Integration with Other Skills

This skill orchestrates the existing individual skills:
- `quality-gate` — quality checks
- `verify-local` — local environment verification
- `check-ci` — GitHub Actions status
- `submodule-workflow` — multi-repo commit flow
- `deploy-pi` — Pi deployment

The individual skills remain available for focused work within a single repo.

## When NOT to Use

- Still developing and not ready to deploy
- Want to test locally first without committing
- CI is already failing on `main` — fix first
- Have uncommitted WIP you're not ready to push
