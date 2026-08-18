---
name: deploy-pi
description: Deploy Dashy to the Raspberry Pi kiosk — SSH to r4pi, pull from main, change-aware selective rebuild, Chromium kiosk restart, health verification, branch sync.
---

# Deploy to Raspberry Pi

Production deployment to the Pi kiosk at `r4pi`.

## Prerequisites

- SSH access to `r4pi` must be configured (key at `~/.ssh/id_ed25519`)
- Working directory is the Dashy orchestrator root
- You are on the `development` branch (deploy switches to `main` automatically)
- Submodules are initialized (`git submodule update --init --recursive`)
- Dev environment does NOT need to be running

## Submodule Workflow

Before deploying, ensure submodule changes are committed and pushed:

```bash
# If you made changes in frontend/ or backend/:
cd frontend/  # or backend/
git add .
git commit -m "feat: your changes"
git push origin development

# Return to orchestrator and update refs
cd ..
make submodule-update
git add frontend/ backend/
git commit -m "chore: update submodule refs"
git push origin development
```

## The Deploy Command

```bash
make deploy-pi
```

This single command handles the entire deployment. Here is what it does step by step:

## What Happens During Deploy

### 1. Local git operations
- Checks out `main` and pulls latest
- Updates submodules to their pinned commits (`git submodule update --init`)
- Detects changes since last deploy (stored in `.last-deployed-commit` on Pi)

### 2. Change detection
The deploy is **selective** — it only rebuilds what changed:
- **Infrastructure changes** (`compose/`, `.env`): full rebuild of everything
- **Frontend changes** (`frontend/`): rebuild frontend only
- **Backend changes** (`backend/`): rebuild backend only
- **No changes**: skips deployment entirely

### 3. Push to Pi
- SSHs to `r4pi` and pulls `main` into `~/dashy`
- Updates submodules on Pi (`git submodule update --init`)

### 4. Chromium kiosk configuration
- Copies `scripts/start-chromium-kiosk.sh` to Pi home directory
- Copies `scripts/chromium-kiosk.desktop` to `~/.config/autostart/`

### 5. Selective rebuild
- For full rebuilds: stops all containers, builds with `--no-cache` for frontend, builds backend, starts all
- For partial rebuilds: only rebuilds and restarts the changed service

### 6. Chromium restart
- Kills Chromium (`pkill -9 chromium`), waits 2 seconds, restarts lightdm
- This is needed because Chromium caches the frontend aggressively

### 7. Health verification
- Curls `https://dashy.local` (frontend) and `https://api.dashy.local/health` (backend) from the Pi
- Reports success/failure for each

### 8. Branch sync
- Switches back to `development`
- Merges `main` into `development`
- Pushes `development` to keep branches in sync

## Known Gotchas

### Frontend build cache
Frontend builds use `--no-cache` because Docker layer caching can serve stale assets. If the Pi shows an old version after deploy, this is usually why.

### Hostname collision
Both Mac dev and Pi production resolve to `dashy.local`. When you browse to `https://dashy.local` on your Mac, you see the LOCAL dev instance, not the Pi. To verify production:
```bash
ssh r4pi "curl -sk https://dashy.local"
ssh r4pi "curl -sk https://api.dashy.local/health"
```

### Kiosk caching
Chromium on the Pi aggressively caches. If the UI looks stale after a frontend deploy:
```bash
ssh r4pi "pkill -9 chromium; sleep 2; sudo systemctl restart lightdm"
```

### First deploy
On first deploy, `.last-deployed-commit` does not exist on the Pi. The script detects this and does a full rebuild of all services.

## Other Deploy Commands

| Command | What it does |
|---------|-------------|
| `make deploy-status` | Show running containers on Pi |
| `make deploy-logs` | Follow production logs on Pi |
| `make deploy-down` | Stop all production containers |
| `make deploy-restart` | Restart all production containers |

## When NOT to deploy

- If CI is failing on `main` — fix first
- If you have uncommitted changes — commit or stash first
- If you are on `main` already — the script checks out `main` from your working tree
