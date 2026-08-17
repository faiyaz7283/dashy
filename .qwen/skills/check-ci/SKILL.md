# Check CI Status

Verify that GitHub Actions CI passes before deploying to production.

## When to Use

- After pushing changes to `development` or `main`
- Before deploying to production
- When debugging CI failures

## Prerequisites

- Changes pushed to GitHub
- GitHub Actions workflow configured

## Check CI Status

### 1. View Recent Workflow Runs

```bash
# List recent workflow runs
gh run list --limit 5

# Check status of latest run
gh run list --limit 1
```

### 2. View Workflow Details

```bash
# View specific run details
gh run view <run-id>

# View logs for failed run
gh run view <run-id> --log

# View only failed steps
gh run view <run-id> --log-failed
```

### 3. Check PR Status (if applicable)

```bash
# List open PRs
gh pr list

# Check PR status (includes CI checks)
gh pr view <pr-number>

# View PR checks
gh pr checks <pr-number>
```

### 4. Wait for CI to Complete

If CI is still running:

```bash
# Watch run until completion
gh run watch <run-id>
```

## Common CI Failures

### Lint Failures
**Symptom**: `make lint` fails
**Fix**: Run `make format` locally, then commit and push

### Type Check Failures
**Symptom**: `make typecheck` fails
**Fix**: Fix TypeScript errors locally, then commit and push

### Test Failures
**Symptom**: `make test` fails
**Fix**: Run tests locally with `make test`, fix failures, then commit and push

### Build Failures
**Symptom**: `make build` fails
**Fix**: Run build locally with `make build`, fix errors, then commit and push

## Success Criteria

- [ ] All workflow steps pass (lint, typecheck, test, build)
- [ ] No failed checks on PR (if applicable)
- [ ] CI completed successfully

## Integration with Workflow

This skill should be run:
1. **After** pushing changes to GitHub
2. **After** local verification passes
3. **Before** deploying to production

## Deployment Decision

**If CI passes**: Proceed with deployment (`make deploy-pi`)
**If CI fails**: Fix issues locally, push again, wait for CI to pass
