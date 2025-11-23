# Claude Agent SDK Experiments

A collection of progressive experiments for learning and developing with the [Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview.md).

## Purpose

This repository contains small, focused experiments that demonstrate different capabilities and patterns when building agents with the Claude Agent SDK. Each experiment is self-contained in a numbered directory, progressing from simple to more complex use cases.

## Development Approach

All experiments are and MUST BE developed using the **`claude-agent-sdk` skill** in Claude Code. This ensures consistent patterns and best practices while providing practical examples for learning.

## Experiments

- **[01-knowledge-agent](01-knowledge-agent/)** - A simple agent that reads and answers questions from local markdown files, demonstrating basic file operations and autonomous tool use.

## Structure

Each experiment is fully self-contained with:
- `CLAUDE.md` - Experiment-specific documentation
- `package.json` - Dependencies for that experiment
- Supporting files as needed

Each experiment manages its own dependencies independently.
