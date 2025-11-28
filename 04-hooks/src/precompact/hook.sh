#!/bin/bash
HOOK_DATA=$(cat)
HOOK_NAME="PreCompact"
LOGS_DIR="logs"
mkdir -p "$LOGS_DIR"
echo "$HOOK_DATA" > "$LOGS_DIR/${HOOK_NAME}_declarative.json"
