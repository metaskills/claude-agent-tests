#!/bin/bash

echo "========================================"
echo "Claude Agent SDK Telemetry Test"
echo "========================================"
echo ""
echo "This script tests if CLAUDE_CODE_ENABLE_TELEMETRY enables native OTel instrumentation."
echo ""

# Test 1: WITHOUT telemetry enabled
echo ""
echo "=== TEST 1: Telemetry DISABLED ==="
echo "Running agent without CLAUDE_CODE_ENABLE_TELEMETRY..."
echo ""
echo -e "What is coffee?\nexit" | node agent.ts

# Clean session between tests
rm -f .session

echo ""
echo ""
echo "=== TEST 2: Telemetry ENABLED ==="
echo "Running agent WITH CLAUDE_CODE_ENABLE_TELEMETRY=1..."
echo ""
echo -e "What is coffee?\nexit" | CLAUDE_CODE_ENABLE_TELEMETRY=1 node agent.ts

echo ""
echo ""
echo "========================================"
echo "Test Complete"
echo "========================================"
echo ""
echo "Analysis:"
echo "- If spans appeared ONLY in TEST 2, the SDK has native instrumentation"
echo "- If NO spans appeared in either test, the SDK is NOT instrumented"
echo "- Look for JSON objects with traceId, spanId, name fields"
echo ""
