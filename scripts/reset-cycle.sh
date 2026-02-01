#!/bin/bash

# Reset cycle script - runs every 4 hours (00, 04, 08, 12, 16, 20 UTC)
# Saves current results to archive, then resets for new cycle

DATA_DIR="/var/www/moltbook-curator/data"
ARCHIVE_DIR="/var/www/moltbook-curator/data/archive"
CURRENT_FILE="$DATA_DIR/projects.json"

# Create archive directory
mkdir -p "$ARCHIVE_DIR"

# Get current timestamp for archive filename
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M")

# Archive current data (if exists and not empty)
if [ -f "$CURRENT_FILE" ] && [ -s "$CURRENT_FILE" ]; then
    cp "$CURRENT_FILE" "$ARCHIVE_DIR/projects_$TIMESTAMP.json"
    echo "[$(date)] Archived to projects_$TIMESTAMP.json"

    # Keep only last 7 days of archives (42 files at 6 per day)
    ls -t "$ARCHIVE_DIR"/projects_*.json 2>/dev/null | tail -n +43 | xargs -r rm
fi

# Reset current data
echo "[]" > "$CURRENT_FILE"
echo "[$(date)] Reset projects.json"

# Log
echo "[$(date)] Cycle reset complete" >> /var/log/moltbook-curator-reset.log
