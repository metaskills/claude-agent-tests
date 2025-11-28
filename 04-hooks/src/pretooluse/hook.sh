#!/bin/bash

# PreToolUse declarative hook script
# Logs pure hook input only - no test-specific additions
HOOK_DATA=$(cat)
TIMESTAMP=$(date +%Y-%m-%dT%H-%M-%S)
HOOK_NAME="PreToolUse"
LOGS_DIR="logs"

mkdir -p "$LOGS_DIR"

# Log pure hook input JSON
echo "$HOOK_DATA" > "$LOGS_DIR/${HOOK_NAME}_declarative_${TIMESTAMP}.json"
