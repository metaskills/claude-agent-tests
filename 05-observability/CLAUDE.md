# Claude Agent SDK - Observability Experiments

## Overview

Tests whether the Claude Agent SDK has native OpenTelemetry instrumentation that can be enabled via the `CLAUDE_CODE_ENABLE_TELEMETRY` environment variable.

**Key Requirements:**
1. Based on 03-knowledge-chat-storage experiment (REPL agent with session management)
2. Test if Claude Agent SDK emits OpenTelemetry metrics/logs using `CLAUDE_CODE_ENABLE_TELEMETRY`
3. Must not rely on 3rd-party telemetry backends (e.g., Langfuse)
4. Assertions look for OTel metrics and logs in console output using local methods

**Initial Hypothesis:** GitHub issue #82 mentions `CLAUDE_CODE_ENABLE_TELEMETRY=1` exists.

**Corrected Understanding:** Claude Code documentation (https://code.claude.com/docs/en/monitoring-usage.md) shows telemetry support exists, but for **metrics and logs** (not distributed tracing spans).

## Architecture

1. **Telemetry Initialization** (`src/telemetry.ts`): Initializes OpenTelemetry SDK with **ConsoleMetricExporter** and **ConsoleLogRecordExporter** BEFORE importing Claude SDK to test if the SDK emits metrics/logs.

2. **Agent Implementation** (`agent.ts`): REPL agent that imports telemetry first, then Claude SDK. Performs operations that would generate telemetry if instrumented: tool usage (Read tool), streaming responses, session operations.

3. **Test Strategy**: Run agent with and without `CLAUDE_CODE_ENABLE_TELEMETRY=1` and compare console output for presence/absence of metrics and log records.

## Usage

### Manual Testing

```bash
# Test WITHOUT telemetry
npm start
# In prompt: "What is coffee?" then "exit"

# Test WITH telemetry
npm run test:with-telemetry
# In prompt: "What is coffee?" then "exit"
```

### Automated Testing

```bash
./test-telemetry.sh
```

The automated script runs both tests sequentially and provides analysis guidance.

## Expected Outputs

### Success Criteria (SDK has native instrumentation)

**WITH `CLAUDE_CODE_ENABLE_TELEMETRY=1`:** Console shows span objects like:
```json
{
  "traceId": "a1b2c3d4e5f6...",
  "spanId": "x1y2z3...",
  "name": "claude.query" or similar SDK operation,
  "kind": 1,
  "timestamp": 1701234567890,
  "duration": 1234,
  "attributes": {
    "key": "value"
  }
}
```

**WITHOUT environment variable:** No span objects in console.

**Conclusion:** SDK has native OTel instrumentation controlled by environment variable.

### Alternative Outcome (SDK has NO native instrumentation)

**Both tests:** No span objects appear in console output.

**Conclusion:** Environment variable has no effect. SDK is not instrumented with OpenTelemetry.

## What to Look For

OpenTelemetry spans appear as JSON objects with these fields:
- `traceId`: Unique trace identifier
- `spanId`: Unique span identifier
- `parentSpanId`: Parent span (for nested operations)
- `name`: Operation name (e.g., "claude.query", "claude.tool.use")
- `kind`: Span kind (INTERNAL=0, CLIENT=1, etc.)
- `timestamp`: Start time in microseconds
- `duration`: Duration in microseconds
- `attributes`: Key-value metadata about the operation
- `status`: Span status (OK, ERROR)

## Test Scenarios

1. **Single tool use**: "What is coffee?"
   - Agent reads coffee-brewing-guide.md
   - Expected spans (if instrumented): query start, tool use, tool result, response

2. **Multi-turn conversation**: Resume session and ask follow-up
   - Tests session-related spans
   - Expected spans (if instrumented): session resume, query continuation

3. **Multiple tools**: "Compare coffee and WebSockets"
   - Agent reads multiple knowledge files
   - Expected spans (if instrumented): query with multiple child tool use spans

## Technical Details

### Import Order

**CRITICAL:** Telemetry module MUST be imported and initialized BEFORE the Claude SDK:

```typescript
// agent.ts
import { telemetry } from "./src/telemetry.ts";
telemetry.initialize();  // FIRST

import { query } from "@anthropic-ai/claude-agent-sdk";  // SECOND
```

This ensures OpenTelemetry's auto-instrumentation can wrap SDK operations if native instrumentation exists.

### OpenTelemetry Configuration

- **NodeSDK**: Main OTel SDK for Node.js with auto-instrumentation support
- **ConsoleSpanExporter**: Outputs spans directly to console for immediate visibility
- **SimpleSpanProcessor**: Processes spans immediately (not batched) for real-time output
- **Resource**: Service identification with name and version

### Environment Variable

Must be set in the same process:
```bash
CLAUDE_CODE_ENABLE_TELEMETRY=1 node agent.ts  # ✓ Correct
```

Not in parent shell:
```bash
export CLAUDE_CODE_ENABLE_TELEMETRY=1
node agent.ts  # ✓ Also works (inherited)
```

## Learnings

### 2025-11-28 - Corrected Test Results (Metrics + Logs)

**Test Configuration:**
- Claude Agent SDK version: 0.1.55
- OpenTelemetry SDK version: 0.54.0
- OpenTelemetry Metrics: 1.28.0
- OpenTelemetry Logs: 0.55.0
- Node.js version: v24.2.0
- Test date: 2025-11-28
- Test method: Corrected implementation using metrics and logs exporters

**Initial Implementation Error:**
- ❌ Original test used `ConsoleSpanExporter` (for distributed tracing spans)
- ✅ Corrected test uses `ConsoleMetricExporter` + `ConsoleLogRecordExporter`
- ℹ️ Claude Code docs mention metrics/logs support, not tracing

**Corrected Test Findings:**
- [x] Test with `CLAUDE_CODE_ENABLE_TELEMETRY=1`: NO metrics or logs appeared in console
- [x] Test without telemetry: NO metrics or logs appeared in console
- [x] Conclusion: **Agent SDK does NOT emit OpenTelemetry metrics or logs**

**Detailed Analysis:**

Both tests executed successfully:
- OpenTelemetry SDK initialized without errors (metrics + logs exporters)
- Agent functioned normally (tool usage, streaming responses)
- Question "What is coffee?" triggered Read tool usage
- Agent successfully read coffee-brewing-guide.md and provided answer

**What we looked for:**
- `resourceMetrics` JSON from ConsoleMetricExporter
- `resourceLogs` JSON from ConsoleLogRecordExporter
- Metrics: session counts, token usage, costs, tool invocations
- Logs: user prompts, tool execution events, API requests, errors

**What we found:**
- Zero metrics output in either test case
- Zero log records in either test case
- Console output identical except for telemetry status message
- Environment variable `CLAUDE_CODE_ENABLE_TELEMETRY` has no observable effect on Agent SDK

**Implications:**

1. **No Built-in Observability**: The Claude Agent SDK does not currently include OpenTelemetry instrumentation, despite community mentions of the `CLAUDE_CODE_ENABLE_TELEMETRY` environment variable.

2. **Manual Instrumentation Required**: For production observability, developers must implement their own instrumentation using:
   - SDK hooks (from 04-hooks experiment): PreToolUse, PostToolUse, Stop, SubagentStart/Stop
   - Custom wrappers around `query()` function
   - Application-level span creation

3. **Hook-Based Approach Recommended**: The 04-hooks experiment demonstrated that SDK hooks fire reliably for agent operations. These can be used to create custom OTel spans:
   - `PreToolUse` → Start tool span
   - `PostToolUse` → End tool span with results
   - `SubagentStart` → Start subagent span
   - `SubagentStop` → End subagent span
   - `Stop` → End query span

4. **Production Deployment**: For Lambda or containerized deployments requiring observability:
   - Implement hook-based instrumentation
   - Wrap query() in custom span creation
   - Export to OTLP collectors (X-Ray, Honeycomb, etc.)
   - Track: query duration, tool usage, model calls, token counts, costs

**Key Discovery:** The Claude Code documentation at https://code.claude.com/docs/en/monitoring-usage.md discusses telemetry for **Claude Code CLI**, not the programmatic Agent SDK. The `CLAUDE_CODE_ENABLE_TELEMETRY` environment variable appears to only instrument the CLI tool wrapper, not the underlying `query()` API used in programmatic contexts.

**Verification:** The official Agent SDK documentation makes no mention of built-in telemetry or OpenTelemetry support. The telemetry capabilities documented are specific to the Claude Code CLI product.

## Future Work

Based on findings that the SDK is **NOT natively instrumented**, future experiments should focus on:

### 06-observability-hooks (Proposed Next Experiment)

Build custom OpenTelemetry instrumentation using SDK hooks:

1. **Hook-Based Span Creation**:
   - Use `PreToolUse` hook to start tool spans
   - Use `PostToolUse` hook to end tool spans with results
   - Use `SubagentStart`/`SubagentStop` for subagent tracing
   - Use `Stop` hook to finalize query spans

2. **Custom Instrumentation Layer**:
   - Wrapper around `query()` that creates root span
   - Automatic correlation ID injection
   - Token usage and cost tracking via span attributes
   - Error tracking and status codes

3. **Production Configuration**:
   - OTLP exporter for Jaeger/Honeycomb/X-Ray
   - Span sampling strategies for high-volume deployments
   - Context propagation across service boundaries
   - Lambda-specific optimizations (EFS vs ephemeral storage)

4. **Metrics Collection**:
   - Query duration histograms
   - Tool usage counters
   - Token consumption gauges
   - Error rates and retry statistics

### Alternative Approaches

- **OpenLLMetry Integration**: Test if `@traceloop/instrumentation-anthropic` can instrument the underlying Anthropic API calls within the Agent SDK
- **Custom MCP Tool**: Build an MCP tool that provides telemetry capabilities to the agent itself
- **Proxy Pattern**: HTTP proxy that intercepts and instruments Bedrock API calls


