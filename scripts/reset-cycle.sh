#!/bin/bash

# Reset cycle script - runs every 4 hours (00, 04, 08, 12, 16, 20 UTC)
# Calls API to archive current data and reset for new cycle

RESET_KEY="${RESET_KEY:-moltbook-curator-reset-2026}"
API_URL="http://127.0.0.1:3000/api/posts/reset"

echo "[$(date)] Starting cycle reset..."

RESPONSE=$(curl -s -X POST "$API_URL" -H "x-reset-key: $RESET_KEY")

echo "[$(date)] Response: $RESPONSE"
echo "[$(date)] Cycle reset complete" >> /var/log/moltbook-curator-reset.log
