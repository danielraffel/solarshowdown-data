#!/bin/bash

set -e  # exit immediately on error

# Set variables
REPO_PATH="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
DATA_URL="http://192.168.86.101:8081/solarshowdown"
DATA_FILE="daniel.json"

cd "$REPO_PATH" || exit 1

# Clean up any old rebase state
rm -rf .git/rebase-merge .git/rebase-apply
git rebase --abort 2>/dev/null || true

# Git identity (one-time setup if not configured)
if [[ -z $(git config user.email) ]]; then
    git config user.email "placeholder@example.com"
    git config user.name "Placeholder Name"
fi

# Use specific SSH key
export GIT_SSH_COMMAND="ssh -i /root/.ssh/id_ed25519 -o IdentitiesOnly=yes"

# Get latest from remote to avoid conflicts
git fetch origin main
git reset --hard origin/main

# Fetch solar data
current_data=$(curl -s "$DATA_URL")
if [ $? -ne 0 ]; then
    echo "Error: Failed to fetch data from $DATA_URL"
    exit 1
fi

# Validate JSON
if ! echo "$current_data" | jq . >/dev/null 2>&1; then
    echo "Error: Received data is not valid JSON"
    exit 1
fi

# Save new JSON
echo "$current_data" > "$DATA_FILE"

# Only commit if the file changed
if ! git diff --quiet "$DATA_FILE"; then
    git add "$DATA_FILE"
    git commit -m "Update solar data $(date '+%Y-%m-%d %H:%M')"
    git push origin main
    echo "✅ Solar data updated and pushed at $(date '+%Y-%m-%d %H:%M')"
else
    echo "ℹ️ No changes to solar data — nothing committed."
fi
