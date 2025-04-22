#!/bin/bash

REPO_PATH="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
DATA_URL="http://192.168.86.101:8081/solarshowdown"
DATA_FILE="daniel.json"

cd "$REPO_PATH" || exit 1

if [[ -z $(git config user.email) ]]; then
    git config user.email "placeholder@example.com"
    git config user.name "Placeholder Name"
fi

export GIT_SSH_COMMAND="ssh -i /root/.ssh/id_ed25519 -o IdentitiesOnly=yes"

# Pull first to avoid rebase issues
git pull --rebase origin main

# Fetch the data
current_data=$(curl -s "$DATA_URL")
if [ $? -ne 0 ] || ! echo "$current_data" | jq . >/dev/null 2>&1; then
    echo "Error fetching or validating JSON"
    exit 1
fi

echo "$current_data" > "$DATA_FILE"

# Only commit and push if changes exist
if ! git diff --quiet "$DATA_FILE"; then
    git add "$DATA_FILE"
    git commit -m "Update solar data $(date '+%Y-%m-%d %H:%M')"
    git push origin main
    echo "Solar data updated successfully"
else
    echo "No changes to commit"
fi

