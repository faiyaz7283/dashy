#!/usr/bin/env bash
# Sync Qwen Code memory between two machines via rsync.
#
# Usage:
#   ./scripts/sync-memory.sh push    # Push this machine's memory to the other
#   ./scripts/sync-memory.sh pull    # Pull the other machine's memory to this one
#
# Configuration:
#   Set REMOTE_HOST below to the other machine's SSH hostname or IP.
#   The default "mac-mini" assumes an SSH config entry exists for it.
#
# What gets synced:
#   ~/.qwen/memories/                              — cross-project user memory
#   ~/.qwen/projects/-Users-admin-dashy/memory/    — Dashy project memory

set -euo pipefail

REMOTE_HOST="${DASHY_SYNC_HOST:-mac-mini}"
REMOTE_USER="admin"
REMOTE_BASE="$HOME/.qwen"
LOCAL_BASE="$HOME/.qwen"

# Memory directories to sync (relative to ~/.qwen/)
SYNC_DIRS=(
    "memories"
    "projects/-Users-admin-dashy/memory"
)

usage() {
    echo "Usage: $0 {push|pull}"
    echo ""
    echo "  push  — send this machine's memory to $REMOTE_HOST"
    echo "  pull  — fetch $REMOTE_HOST's memory to this machine"
    echo ""
    echo "Override remote host: DASHY_SYNC_HOST=hostname $0 push"
    exit 1
}

sync_dir() {
    local direction="$1"
    local rel_path="$2"
    local src dst

    if [ "$direction" = "push" ]; then
        src="$LOCAL_BASE/$rel_path/"
        dst="$REMOTE_USER@$REMOTE_HOST:$REMOTE_BASE/$rel_path/"
    else
        src="$REMOTE_USER@$REMOTE_HOST:$REMOTE_BASE/$rel_path/"
        dst="$LOCAL_BASE/$rel_path/"
    fi

    # Ensure local directory exists before pulling
    if [ "$direction" = "pull" ]; then
        mkdir -p "$LOCAL_BASE/$rel_path"
    fi

    echo "  Syncing: $rel_path"
    rsync -avz --delete "$src" "$dst"
}

if [ $# -ne 1 ]; then
    usage
fi

DIRECTION="$1"

if [ "$DIRECTION" != "push" ] && [ "$DIRECTION" != "pull" ]; then
    usage
fi

echo "Qwen Memory Sync"
echo "  Direction: $DIRECTION"
echo "  Remote:    $REMOTE_USER@$REMOTE_HOST"
echo ""

for dir in "${SYNC_DIRS[@]}"; do
    if [ -d "$LOCAL_BASE/$dir" ] || [ "$DIRECTION" = "pull" ]; then
        sync_dir "$DIRECTION" "$dir"
    else
        echo "  Skipping: $dir (not found locally)"
    fi
done

echo ""
echo "Sync complete."
