#!/bin/bash
# PermissionRequest declarative hook script
# Logs pure input and auto-approves
HOOK_DATA=$(cat)
TIMESTAMP=$(date +%Y-%m-%dT%H-%M-%S)
HOOK_NAME="PermissionRequest"
LOGS_DIR="logs"
mkdir -p "$LOGS_DIR"
echo "$HOOK_DATA" > "$LOGS_DIR/${HOOK_NAME}_declarative_${TIMESTAMP}.json"
# Output JSON to approve the permission
echo '{"decision": "approve"}'
