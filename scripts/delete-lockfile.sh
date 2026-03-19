#!/bin/bash
set -e

echo "Deleting corrupted package-lock.json from GitHub..."

# Configure git with safe directory
git config --global --add safe.directory /vercel/share/v0-project

# Check current branch
echo "Current branch:"
git branch -a

# Fetch the latest from main
git fetch origin main

# Switch to main and delete the file
git checkout main
echo "Switched to main branch"

# Delete the corrupted package-lock.json
rm -f package-lock.json
echo "Deleted package-lock.json"

# Commit and push
git add -A
git commit -m "Remove corrupted package-lock.json" || echo "No changes to commit"
git push origin main

echo "Successfully deleted package-lock.json from GitHub main branch"
