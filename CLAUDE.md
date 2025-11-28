# Claude Agent SDK Experiments

A collection of progressive experiments for learning and developing with the [Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview.md).

## Purpose

This repository contains small, focused experiments that demonstrate different capabilities and patterns when building agents with the Claude Agent SDK. Each experiment is self-contained in a numbered directory, progressing from simple to more complex use cases.

## AWS Configuration

All experiments assume AWS Bedrock authentication is configured via environment variables:

- `AWS_BEARER_TOKEN_BEDROCK` - Long-term bearer token for Bedrock access
- `CLAUDE_CODE_USE_BEDROCK=1` - Enables Bedrock routing

Experiments access these via `process.env` and assume they are set in your shell environment.

## Development Approach

All experiments are and MUST BE developed using the **`claude-agent-sdk` skill** in Claude Code. This ensures consistent patterns and best practices while providing practical examples for learning.

## Experiments

- **[01-knowledge-agent](01-knowledge-agent/)** - Single-shot Q&A agent that reads and answers questions from local markdown files, demonstrating basic file operations and autonomous tool use.
- **[02-knowledge-chat](02-knowledge-chat/)** - Interactive REPL chat with session persistence and resume capability, exploring turn-based conversation patterns and CLI input.
- **[03-knowledge-chat-storage](03-knowledge-chat-storage/)** - Deep investigation into session storage architecture, SessionStart hooks, and real-time streaming responses.
- **[04-hooks](04-hooks/)** - Comprehensive testing of all 11 Claude Agent SDK hook events with both programmatic (TypeScript callbacks) and declarative (shell scripts) approaches. Includes validation, comparison tools, and [complete hooks reference](04-hooks/Hooks.md).
- **[05-observability](05-observability/)** - Tests whether Claude Agent SDK has native OpenTelemetry instrumentation. Discovers that `CLAUDE_CODE_ENABLE_TELEMETRY` works with Claude Code CLI but NOT with programmatic Agent SDK. Documents correct OTel configuration (metrics/logs, not traces) and implications for production observability.

## Hooks Reference

For comprehensive TypeScript type definitions and usage guidance for all 11 Claude Agent SDK hook events, see **[04-hooks/Hooks.md](04-hooks/Hooks.md)**.

Key findings from hook testing:
- **SessionStart/SessionEnd**: Lifecycle hooks only work with declarative (shell script) configuration, not programmatic callbacks in SDK
- **PermissionRequest**: Observe-only hook that logs permission requests but cannot auto-approve/deny
- **Easy reference table**: See [04-hooks/CLAUDE.md](04-hooks/CLAUDE.md) for a table of all hook names, key questions, and "when to use" recommendations

## Structure

Each experiment is fully self-contained with:
- `CLAUDE.md` - Experiment-specific documentation
- `package.json` - Dependencies for that experiment
- Supporting files as needed

Each experiment manages its own dependencies independently.

## Testing Bedrock Configuration

To verify your AWS Bedrock setup is working:

```bash
node 01-knowledge-agent/agent.ts "What is coffee?"
```

Expected output:
- Agent reads `coffee-brewing-guide.md`
- Provides answer about coffee from the knowledge files
- Completes successfully with agent response
