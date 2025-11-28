#!/bin/bash

# Read hook data from stdin (JSON)
HOOK_DATA=$(cat)

# Extract hook name from filename
HOOK_NAME=$(basename "$0" .sh | tr '-' '_')

# Create timestamp for unique filename
TIMESTAMP=$(date +%Y-%m-%dT%H-%M-%S)

# Log to JSON file (with jq if available, otherwise raw)
if command -v jq >/dev/null 2>&1; then
  echo "$HOOK_DATA" | jq '.' > "../logs/${HOOK_NAME}_${TIMESTAMP}.json"
else
  echo "$HOOK_DATA" > "../logs/${HOOK_NAME}_${TIMESTAMP}.json"
fi

# Log to stderr for visibility
echo "🪝 ${HOOK_NAME} triggered" >&2
