# Submodule Workflow

Guide for working across the orchestrator and its submodules (frontend and backend).

## When to Use

When making changes that span the orchestrator and submodules, or when you need to update submodule references after making changes in a submodule.

## Repository Structure

```
dashy/                    # Orchestrator (this repo)
├── frontend/             # Submodule → dashy-kiosk
├── backend/              # Submodule → dashy-api
├── compose/              # Docker compose files
├── scripts/              # Deployment scripts
└── docs/                 # Documentation
```

## Workflow: Making Changes in a Submodule

### 1. Work Inside the Submodule

```bash
cd frontend/  # or cd backend/
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
git add frontend/  # or backend/
git commit -m "chore: update frontend submodule"
git push origin development
```

### 5. Deploy

```bash
make deploy-pi
```

The deploy script automatically pulls the latest submodule commits.

## Workflow: Updating Multiple Submodules

If you need to make coordinated changes across frontend and backend:

1. **Update backend first** (if API changes):
   - Make changes in `backend/`
   - Commit and push
   - Update orchestrator: `git add backend/ && git commit`

2. **Update frontend second** (to consume new API):
   - Make changes in `frontend/`
   - Commit and push
   - Update orchestrator: `git add frontend/ && git commit`

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
| Update all submodules | `make submodule-update` |
| Check submodule status | `git submodule status` |
| Initialize submodules (after clone) | `git submodule update --init --recursive` |
| Enter a submodule | `cd frontend/` or `cd backend/` |

## Important Notes

- **Submodules have independent git history** — commits in `frontend/` don't affect the orchestrator until you `git add frontend/`
- **Always commit in the submodule first**, then update the orchestrator
- **The orchestrator pins specific submodule commits** — updating the orchestrator records which submodule commits are in use
- **Deploy pulls the latest** — `make deploy-pi` runs `git submodule update --init --remote` to get the latest submodule commits

## Troubleshooting

### Submodule shows "dirty" or modified

```bash
cd frontend/  # or backend/
git status    # see what changed
git add . && git commit -m "wip: uncommitted changes"
cd ..
git add frontend/
git commit -m "chore: update frontend submodule"
```

### Submodule is behind remote

```bash
make submodule-update
```

### Need to switch submodule to a different branch

```bash
cd frontend/
git checkout feature-branch
# make changes, commit, push
cd ..
git add frontend/
git commit -m "chore: update frontend to feature-branch"
```
