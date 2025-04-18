#!/bin/bash

# Set variables
REPO_PATH="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SCRIPT="leaderboard/solar-summary.js"

# Navigate to the repository
cd "$REPO_PATH" || exit 1

# Configure Git identity if not already set
if [[ -z $(git config user.email) ]]; then
    git config user.email "placeholder@example.com"
    git config user.name "Placeholder Name"
    echo "Git identity configured"
fi

# Set GIT_SSH_COMMAND to use the specific key
export GIT_SSH_COMMAND="ssh -i /root/.ssh/id_ed25519 -o IdentitiesOnly=yes"

# Run the Node.js script to generate/update daily-leaderboard.json
node "$SCRIPT"

# Add and commit changes
git add leaderboard/daily-leaderboard.json
git commit -m "Update daily leaderboard $(date '+%Y-%m-%d %H:%M')"

# Pull remote changes to avoid push conflicts
git pull --rebase origin main

# Push to GitHub
git push origin main

echo "Daily leaderboard updated successfully at $(date '+%Y-%m-%d %H:%M')" 