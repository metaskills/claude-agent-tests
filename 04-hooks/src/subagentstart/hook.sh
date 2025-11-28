#!/bin/bash
HOOK_DATA=$(cat)
TIMESTAMP=$(date +%Y-%m-%dT%H-%M-%S)
HOOK_NAME="SubagentStart"
LOGS_DIR="logs"
mkdir -p "$LOGS_DIR"
echo "$HOOK_DATA" > "$LOGS_DIR/${HOOK_NAME}_declarative_${TIMESTAMP}.json"
