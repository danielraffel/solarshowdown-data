#!/bin/bash

# Set variables
REPO_PATH="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
DATA_URL="http://192.168.86.101:8081/solarshowdown"
DATA_FILE="daniel.json"

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

# Preemptively stash any local changes that might block rebase
STASHED=0
if ! git diff --quiet || ! git diff --cached --quiet || [ -n "$(git ls-files --others --exclude-standard)" ]; then
    git stash --include-untracked
    STASHED=1
    echo "Stashed local changes"
fi

# Pull the latest changes with rebase
git pull --rebase origin main
if [ $? -ne 0 ]; then
    echo "Error: git pull --rebase failed"
    [ "$STASHED" -eq 1 ] && git stash pop
    exit 1
fi

# Reapply stash if needed
if [ "$STASHED" -eq 1 ]; then
    git stash pop
    echo "Reapplied stashed changes"
fi

# Fetch the data
current_data=$(curl -s "$DATA_URL")
if [ $? -ne 0 ]; then
    echo "Error: Failed to fetch data from $DATA_URL"
    exit 1
fi

# Check if it's valid JSON
if ! echo "$current_data" | jq . >/dev/null 2>&1; then
    echo "Error: Received data is not valid JSON"
    exit 1
fi

# Save the data to the file
echo "$current_data" > "$DATA_FILE"

# Only commit if file changed
if ! git diff --quiet "$DATA_FILE"; then
    git add "$DATA_FILE"
    git commit -m "Update solar data $(date '+%Y-%m-%d %H:%M')"
    GIT_TRACE=1 git push origin main
    echo "Solar data updated successfully at $(date '+%Y-%m-%d %H:%M')"
else
    echo "No changes to commit"
fi

