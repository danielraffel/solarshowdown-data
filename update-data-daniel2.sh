#!/bin/bash

# Set variables
REPO_PATH="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
DATA_URL="http://192.168.86.101:8081/solarshowdown"
DATA_FILE="daniel.json"

cd "$REPO_PATH" || exit 1

# Git identity
if [[ -z $(git config user.email) ]]; then
    git config user.email "placeholder@example.com"
    git config user.name "Placeholder Name"
fi

# SSH key
export GIT_SSH_COMMAND="ssh -i /root/.ssh/id_ed25519 -o IdentitiesOnly=yes"

# Stash if anything is modified, staged, or untracked
STASHED=0
if ! git diff --quiet || ! git diff --cached --quiet || [ -n "$(git ls-files --others --exclude-standard)" ]; then
    git stash --include-untracked
    STASHED=1
    echo "🔒 Stashed local changes"
fi

# Pull latest with rebase
git pull --rebase origin main || {
    echo "❌ git pull failed"
    [ "$STASHED" -eq 1 ] && git stash pop
    exit 1
}

# Reapply stash if needed
[ "$STASHED" -eq 1 ] && git stash pop || true

# Fetch and validate
current_data=$(curl --silent --fail "$DATA_URL")
if [ $? -ne 0 ] || [ -z "$current_data" ]; then
    echo "❌ Failed to fetch or got empty data from $DATA_URL"
    exit 1
fi

# Optional: add timestamp
current_data=$(echo "$current_data" | jq --arg now "$(date --iso-8601=seconds)" '. + {generatedAt: $now}')

# Save file
echo "$current_data" > "$DATA_FILE"

# Only commit if file changed
if ! git diff --quiet "$DATA_FILE"; then
    git add "$DATA_FILE"
    git commit -m "Update solar data $(date '+%Y-%m-%d %H:%M')"
    git push origin main
    echo "✅ Solar data updated successfully"
else
    echo "ℹ️ No changes to commit"
fi

