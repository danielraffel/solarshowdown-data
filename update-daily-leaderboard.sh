#!/bin/bash

REPO_PATH="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SCRIPT="leaderboard/solar-summary.js"
OUTPUT_FILE="leaderboard/daily-leaderboard.json"

cd "$REPO_PATH" || exit 1

# Configure Git identity if not already set
if [[ -z $(git config user.email) ]]; then
    git config user.email "placeholder@example.com"
    git config user.name "Placeholder Name"
    echo "Git identity configured"
fi

# Set SSH key for Git
export GIT_SSH_COMMAND="ssh -i /root/.ssh/id_ed25519 -o IdentitiesOnly=yes"

# Preemptively stash any local changes that might block rebase
STASHED=0
if ! git diff --quiet || ! git diff --cached --quiet || [ -n "$(git ls-files --others --exclude-standard)" ]; then
    git stash --include-untracked
    STASHED=1
    echo "Stashed local changes"
fi

# Pull latest changes with rebase
git pull --rebase origin main
if [ $? -ne 0 ]; then
    echo "Error: git pull --rebase failed"
    [ "$STASHED" -eq 1 ] && git stash pop
    exit 1
fi

# Reapply stashed changes if any
if [ "$STASHED" -eq 1 ]; then
    git stash pop
    echo "Reapplied stashed changes"
fi

# Run leaderboard script
node "$SCRIPT"

# Only commit if leaderboard file changed
if ! git diff --quiet "$OUTPUT_FILE"; then
    git add "$OUTPUT_FILE"
    git commit -m "Update daily leaderboard $(date '+%Y-%m-%d %H:%M')"
    git push origin main
    echo "Daily leaderboard updated successfully"
else
    echo "No leaderboard changes to commit"
fi

