# Submodule Workflow

Guide for working across the orchestrator and its submodules (kiosk and API).

## When to Use

When making changes that span the orchestrator and submodules, or when you need to update submodule references after making changes in a submodule.

## Repository Structure

```
dashy/                    # Orchestrator (this repo)
├── dashy-kiosk/          # Submodule → dashy-kiosk
├── dashy-api/            # Submodule → dashy-api
├── compose/              # Docker compose files
├── scripts/              # Deployment scripts
└── docs/                 # Documentation
```

## Workflow: Making Changes in a Submodule

### 1. Work Inside the Submodule

```bash
cd dashy-kiosk/  # or cd dashy-api/
```

The submodule is a full git repo with its own history.

### 2. Make Your Changes

Edit files, add tests, etc. as normal.

### 3. Commit and Push in the Submodule

```bash
git add .
git commit -m "feat: your change"
git push origin development
```

### 4. Update the Orchestrator

Return to the orchestrator root and update the submodule reference:

```bash
cd ..
make submodule-update
```

Or manually:

```bash
git add dashy-kiosk/  # or dashy-api/
git commit -m "chore: update kiosk submodule"
git push origin development
```

### 5. Deploy

```bash
make deploy-pi
```

The deploy script automatically pulls the latest submodule commits.

## Workflow: Updating Multiple Submodules

If you need to make coordinated changes across kiosk and API:

1. **Update API first** (if API changes):
   - Make changes in `dashy-api/`
   - Commit and push
   - Update orchestrator: `git add dashy-api/ && git commit`

2. **Update kiosk second** (to consume new API):
   - Make changes in `dashy-kiosk/`
   - Commit and push
   - Update orchestrator: `git add dashy-kiosk/ && git commit`

3. **Push orchestrator**:
   ```bash
   git push origin development
   ```

4. **Deploy**:
   ```bash
   make deploy-pi
   ```

## Common Commands

| Task | Command |
|------|---------|
| Sync all repos + submodules | `make sync` |
| Update all submodules | `make submodule-update` |
| Check submodule status | `git submodule status` |
| Enter a submodule | `cd dashy-kiosk/` or `cd dashy-api/` |

## Important Notes

- **Submodules have independent git history** — commits in `dashy-kiosk/` don't affect the orchestrator until you `git add dashy-kiosk/`
- **Always commit in the submodule first**, then update the orchestrator
- **The orchestrator pins specific submodule commits** — updating the orchestrator records which submodule commits are in use
- **Deploy pulls the latest** — `make deploy-pi` runs `git submodule update --init --remote` to get the latest submodule commits

## Troubleshooting

### Submodule shows "dirty" or modified

```bash
cd dashy-kiosk/  # or dashy-api/
git status    # see what changed
git add . && git commit -m "wip: uncommitted changes"
cd ..
git add dashy-kiosk/
git commit -m "chore: update kiosk submodule"
```

### Submodule is behind remote

```bash
make submodule-update
```

### Need to switch submodule to a different branch

```bash
cd dashy-kiosk/
git checkout feature-branch
# make changes, commit, push
cd ..
git add dashy-kiosk/
git commit -m "chore: update kiosk to feature-branch"
```
