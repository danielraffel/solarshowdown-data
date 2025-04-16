#!/bin/bash
cd /opt/solarshowdown-data || exit 1

# Pull any new commits first (rebase to avoid merge commits)
git pull --rebase origin main

# Add, commit, and push if there are changes
if [ -n "$(git status --porcelain)" ]; then
  git add .
  git commit -m "Failsafe auto-push $(date -u +"%Y-%m-%d %H:%M") UTC"
  git push origin main
fi
