#!/bin/bash

# UserPromptSubmit declarative hook script
HOOK_DATA=$(cat)
TIMESTAMP=$(date +%Y-%m-%dT%H-%M-%S)
HOOK_NAME="UserPromptSubmit"
LOGS_DIR="logs"

mkdir -p "$LOGS_DIR"

LOG_DATA=$(echo "$HOOK_DATA" | jq --arg approach "declarative" --arg logged_at "$(date -u +%Y-%m-%dT%H:%M:%SZ)" '. + {approach: $approach, logged_at: $logged_at}')

echo "$LOG_DATA" > "$LOGS_DIR/${HOOK_NAME}_declarative_${TIMESTAMP}.json"
echo "  ${HOOK_NAME} (declarative) logged to logs/${HOOK_NAME}_declarative_${TIMESTAMP}.json" >&2
