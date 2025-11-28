#!/bin/bash

# PreToolUse declarative hook script
# Reads hook data from stdin and logs to JSON file

HOOK_DATA=$(cat)
TIMESTAMP=$(date +%Y-%m-%dT%H-%M-%S)
HOOK_NAME="PreToolUse"
LOGS_DIR="logs"

# Ensure logs directory exists
mkdir -p "$LOGS_DIR"

# Add approach and timestamp to data
LOG_DATA=$(echo "$HOOK_DATA" | jq --arg approach "declarative" --arg logged_at "$(date -u +%Y-%m-%dT%H:%M:%SZ)" '. + {approach: $approach, logged_at: $logged_at}')

# Write to JSON file
echo "$LOG_DATA" > "$LOGS_DIR/${HOOK_NAME}_declarative_${TIMESTAMP}.json"

# Log to stderr for visibility
echo "  ${HOOK_NAME} (declarative) logged to logs/${HOOK_NAME}_declarative_${TIMESTAMP}.json" >&2
