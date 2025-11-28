# Claude Agent SDK - Hooks Reference

Complete reference for all hook events in the Claude Agent SDK, including their data structures and recommended use cases.

## Overview

Hooks allow you to intercept and respond to events throughout the agent lifecycle. They provide fine-grained control over tool execution, session management, and user interactions.

### Configuration Methods

**Programmatic Configuration** (via `query()` options):
```typescript
import { query } from '@anthropic-ai/claude-agent-sdk';

const result = query({
  prompt: "Your prompt",
  options: {
    hooks: {
      'SessionStart': [{
        hooks: [async (input, toolUseID, options) => ({
          continue: true
        })]
      }]
    }
  }
});
```

**Declarative Configuration** (via `.claude/settings.json`):
```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup",
        "hooks": [
          {
            "type": "command",
            "command": "path/to/script.sh"
          }
        ]
      }
    ]
  }
}
```

**Important**: When using `.claude/settings.json`, you must include `settingSources: ["project"]` in your query options:
```typescript
query({
  prompt: "...",
  options: {
    settingSources: ["project"]  // Required to load project settings
  }
})
```

### Hook Callback Signature

```typescript
type HookCallback = (
  input: HookInput,
  toolUseID: string | undefined,
  options: { signal: AbortSignal }
) => Promise<HookJSONOutput>
```

## Base Hook Input

All hooks receive these base fields:

```typescript
{
  session_id: string           // Session UUID
  transcript_path: string      // Path to session transcript JSONL file
  cwd: string                  // Current working directory
  permission_mode?: string     // Current permission mode
}
```

## Hook Reference

### SessionStart

**When to use**: Use when you need to initialize the session with project context, environment variables, or run setup scripts at startup.

**Complete data structure**:
```typescript
{
  // Base fields (all hooks)
  session_id: string
  transcript_path: string
  cwd: string
  permission_mode?: string

  // SessionStart-specific fields
  hook_event_name: 'SessionStart'
  source: 'startup' | 'resume' | 'clear' | 'compact'
}
```

---

### UserPromptSubmit

**When to use**: Use when you want to enhance user prompts with additional information or validate/block prompts before Claude processes them.

**Complete data structure**:
```typescript
{
  // Base fields (all hooks)
  session_id: string
  transcript_path: string
  cwd: string
  permission_mode?: string

  // UserPromptSubmit-specific fields
  hook_event_name: 'UserPromptSubmit'
  prompt: string
}
```

---

### PermissionRequest

**When to use**: Use when you want to automatically handle permission dialogs without user interaction, or log permission requests for auditing.

**Complete data structure**:
```typescript
{
  // Base fields (all hooks)
  session_id: string
  transcript_path: string
  cwd: string
  permission_mode?: string

  // PermissionRequest-specific fields
  hook_event_name: 'PermissionRequest'
  tool_name: string
  tool_input: unknown
  permission_suggestions?: PermissionUpdate[]
}
```

---

### PreToolUse

**When to use**: Use when you need fine-grained control over tool execution, want to modify parameters, or enforce security policies before tools run.

**Complete data structure**:
```typescript
{
  // Base fields (all hooks)
  session_id: string
  transcript_path: string
  cwd: string
  permission_mode?: string

  // PreToolUse-specific fields
  hook_event_name: 'PreToolUse'
  tool_name: string
  tool_input: unknown
  tool_use_id: string
}
```

---

### PostToolUse

**When to use**: Use when you want to automatically process tool results (e.g., format code, run linters) or provide feedback to Claude about what just happened.

**Complete data structure**:
```typescript
{
  // Base fields (all hooks)
  session_id: string
  transcript_path: string
  cwd: string
  permission_mode?: string

  // PostToolUse-specific fields
  hook_event_name: 'PostToolUse'
  tool_name: string
  tool_input: unknown
  tool_response: unknown
  tool_use_id: string
}
```

---

### Notification

**When to use**: Use when you want to customize how Claude Code sends notifications (e.g., desktop alerts, sounds, logging).

**Complete data structure**:
```typescript
{
  // Base fields (all hooks)
  session_id: string
  transcript_path: string
  cwd: string
  permission_mode?: string

  // Notification-specific fields
  hook_event_name: 'Notification'
  message: string
  title?: string
  notification_type: string
}
```

---

### SubagentStart

**When to use**: Use when you need to provide additional context or configuration when a subagent is launched.

**Complete data structure**:
```typescript
{
  // Base fields (all hooks)
  session_id: string
  transcript_path: string
  cwd: string
  permission_mode?: string

  // SubagentStart-specific fields
  hook_event_name: 'SubagentStart'
  agent_id: string
  agent_type: string
}
```

---

### SubagentStop

**When to use**: Use when you want to validate subagent completeness or ensure subagents fully complete their assigned tasks before stopping.

**Complete data structure**:
```typescript
{
  // Base fields (all hooks)
  session_id: string
  transcript_path: string
  cwd: string
  permission_mode?: string

  // SubagentStop-specific fields
  hook_event_name: 'SubagentStop'
  stop_hook_active: boolean
  agent_id: string
  agent_transcript_path: string
}
```

---

### PreCompact

**When to use**: Use when you want to preserve important context or state before Claude compacts the conversation history.

**Complete data structure**:
```typescript
{
  // Base fields (all hooks)
  session_id: string
  transcript_path: string
  cwd: string
  permission_mode?: string

  // PreCompact-specific fields
  hook_event_name: 'PreCompact'
  trigger: 'manual' | 'auto'
  custom_instructions: string | null
}
```

---

### Stop

**When to use**: Use when you want to verify task completion, check for errors, or force Claude to continue working on unfinished tasks.

**Complete data structure**:
```typescript
{
  // Base fields (all hooks)
  session_id: string
  transcript_path: string
  cwd: string
  permission_mode?: string

  // Stop-specific fields
  hook_event_name: 'Stop'
  stop_hook_active: boolean
}
```

---

### SessionEnd

**When to use**: Use when you need to perform cleanup tasks, save analytics, generate reports, or archive conversation data at session end.

**Complete data structure**:
```typescript
{
  // Base fields (all hooks)
  session_id: string
  transcript_path: string
  cwd: string
  permission_mode?: string

  // SessionEnd-specific fields
  hook_event_name: 'SessionEnd'
  reason: ExitReason  // Exit reason code from SDK
}
```

## Hook Output Types

### AsyncHookJSONOutput

For long-running async operations:
```typescript
{
  async: true
  asyncTimeout?: number  // Timeout in seconds
}
```

### SyncHookJSONOutput

For synchronous operations with control flow options:
```typescript
{
  continue?: boolean              // Continue execution (default: true)
  suppressOutput?: boolean        // Hide hook output from user
  stopReason?: string            // Reason for stopping execution
  decision?: 'approve' | 'block' // Hook decision
  systemMessage?: string         // Message to display to user
  reason?: string                // Reason for decision
  hookSpecificOutput?: {         // Hook-specific output options
    // See TypeScript definitions for specific hook output types
  }
}
```

## References

- TypeScript definitions: `@anthropic-ai/claude-agent-sdk/sdk.d.ts`
- Official documentation: https://platform.claude.com/docs/en/agent-sdk/typescript.md
