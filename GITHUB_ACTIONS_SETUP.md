# GitHub Actions Setup Guide

## Overview
Dashy uses GitHub Actions for automated testing and deployment:
- **test.yml** - Runs on every push/PR to `development` or `main`
- **deploy.yml** - Deploys to Raspberry Pi when code is pushed to `main`

## Step 1: Generate SSH Key for GitHub Actions

The Pi already has an SSH key for GitHub access. We need to create a **separate SSH key** for GitHub Actions to SSH into the Pi.

```bash
# Generate a new SSH key (no passphrase)
ssh-keygen -t ed25519 -C "github-actions@dashy" -f ~/.ssh/dashy-pi-deploy

# This creates:
# ~/.ssh/dashy-pi-deploy (private key)
# ~/.ssh/dashy-pi-deploy.pub (public key)
```

## Step 2: Add Public Key to Raspberry Pi

Copy the public key to the Pi:

```bash
ssh-copy-id -i ~/.ssh/dashy-pi-deploy.pub rpi4_main@dashy.local
```

Or manually:

```bash
cat ~/.ssh/dashy-pi-deploy.pub | ssh rpi4_main@dashy.local "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

## Step 3: Add Private Key to GitHub Secrets

1. Go to your GitHub repo: https://github.com/faiyaz7283/dashy
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the following secrets:

### Secret 1: PI_SSH_KEY
- **Name:** `PI_SSH_KEY`
- **Value:** Contents of `~/.ssh/dashy-pi-deploy` (private key)

```bash
cat ~/.ssh/dashy-pi-deploy
```

Copy the entire output (including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`).

### Secret 2: SMTP_USERNAME (for email notifications)
- **Name:** `SMTP_USERNAME`
- **Value:** Your Gmail address (e.g., `faiyaz7283@gmail.com`)

### Secret 3: SMTP_PASSWORD (for email notifications)
- **Name:** `SMTP_PASSWORD`
- **Value:** Gmail App Password (NOT your regular password)

To generate a Gmail App Password:
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and your device
3. Copy the 16-character password

## Step 4: Initial Pi Setup

SSH into the Pi and clone the repo:

```bash
ssh rpi4_main@dashy.local

# Clone the repo
cd ~
git clone git@github.com:faiyaz7283/dashy.git
cd dashy

# Create production env file
cp env/.env.prod.example env/.env.prod

# Edit with your actual values (if different from example)
nano env/.env.prod
```

## Step 5: Test the Workflow

1. Commit and push to `development`:
   ```bash
   git add .
   git commit -m "feat: add GitHub Actions workflows"
   git push origin development
   ```

2. Check GitHub Actions tab to see tests running

3. When ready to deploy, merge to `main`:
   ```bash
   git checkout main
   git merge development
   git push origin main
   ```

4. The deploy workflow will automatically:
   - SSH into the Pi
   - Pull latest code
   - Build and start Docker containers
   - Send email notification

## Troubleshooting

### SSH Connection Fails
- Verify Pi is reachable: `ping dashy.local`
- Check SSH key permissions: `chmod 600 ~/.ssh/dashy-pi-deploy`
- Test SSH manually: `ssh -i ~/.ssh/dashy-pi-deploy rpi4_main@dashy.local`

### Deployment Fails
- Check GitHub Actions logs for error details
- SSH into Pi and check Docker logs: `docker compose -f compose/docker-compose.prod.yml logs`
- Verify Pi has internet access for Docker pulls

### Email Notifications Not Working
- Verify SMTP credentials in GitHub Secrets
- Check Gmail "Less secure app access" is enabled (or use App Password)
- Check spam folder
