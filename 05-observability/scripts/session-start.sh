#!/bin/bash

# Read session data from stdin (JSON with session_id, transcript_path, etc.)
SESSION_DATA=$(cat)

# Parse session ID - try jq first, fallback to grep
if command -v jq >/dev/null 2>&1; then
  SESSION_ID=$(echo "$SESSION_DATA" | jq -r '.session_id')
else
  # Fallback: extract using grep/sed
  SESSION_ID=$(echo "$SESSION_DATA" | grep -o '"session_id":"[^"]*"' | cut -d'"' -f4)
fi

# Save to .session file
echo "$SESSION_ID" > .session
