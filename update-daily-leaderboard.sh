#!/bin/bash

REPO_PATH="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SCRIPT="leaderboard/solar-summary.js"

cd "$REPO_PATH" || exit 1

git branch --set-upstream-to=origin/main main
export GIT_SSH_COMMAND="ssh -i /root/.ssh/id_ed25519 -o IdentitiesOnly=yes"

# Pull first
git pull --rebase origin main

if [[ -z $(git config user.email) ]]; then
    git config user.email "placeholder@example.com"
    git config user.name "Placeholder Name"
fi

# Generate leaderboard
node "$SCRIPT"

# Commit only if file has changed
if ! git diff --quiet leaderboard/daily-leaderboard.json; then
    git add leaderboard/daily-leaderboard.json
    git commit -m "Update daily leaderboard $(date '+%Y-%m-%d %H:%M')"
    git push origin main
    echo "Daily leaderboard updated successfully"
else
    echo "No leaderboard changes to commit"
fi

