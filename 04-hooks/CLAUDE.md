# Claude Agent SDK - Hooks Testing Experiment

## What This Does

Isolated testing of all 11 Claude Agent SDK hook events. Each hook has its own test directory that runs both programmatic (TypeScript callbacks) and declarative (shell scripts) approaches, then compares the results.

## Hook Reference

Copied From: https://x.com/dani_avila7/status/1992271570891387051

| Hook Event | Key Question | When to Use | Programmatic | Declarative |
| :--- | :--- | :--- | :---: | :---: |
| **SessionStart** | Do I need to load initial context or set up the environment? | Use when you need to initialize the session with project context, environment variables, or run setup scripts at startup. | ❌ | ✅ |
| **UserPromptSubmit** | Should I add more context or validate this prompt? | Use when you want to enhance user prompts with additional information or validate/block prompts before Claude processes them. | ✅ | ✅ |
| **PermissionRequest** | Should I auto-approve or deny this permission request? | Use when you want to automatically handle permission dialogs without user interaction, or log permission requests for auditing. | ✅ | ✅ |
| **PreToolUse** | Should I allow, modify, or block this tool execution? | Use when you need fine-grained control over tool execution, want to modify parameters, or enforce security policies before tools run. | ✅ | ✅ |
| **PostToolUse** | Do I need to validate results or provide feedback on what executed? | Use when you want to automatically process tool results (e.g., format code, run linters) or provide feedback to Claude about what just happened. | ✅ | ✅ |
| **Notification** | Should I notify the user in a specific way? | Use when you want to customize how Claude Code sends notifications (e.g., desktop alerts, sounds, logging). | 🌀 | 🌀 |
| **Stop** | Did Claude complete all tasks or should it continue working? | Use when you want to verify task completion, check for errors, or force Claude to continue working on unfinished tasks. | ✅ | ✅ |
| **SubagentStart** | Is a subagent being launched that I need to track? | Use when you want to monitor or log subagent launches, or apply policies to Task tool invocations. | ✅ | ✅ |
| **SubagentStop** | Did the subagent finish its work or does it need to do more? | Use when you want to validate subagent completeness or ensure subagents fully complete their assigned tasks before stopping. | ✅ | ✅ |
| **PreCompact** | Do I need to save information before compacting context? | Use when you want to preserve important context or state before Claude compacts the conversation history. | 🌀 | 🌀 |
| **SessionEnd** | Should I clean up or save session statistics? | Use when you need to perform cleanup tasks, save analytics, generate reports, or archive conversation data at session end. | ❌ | ✅ |

**Legend:**  
- ✅ Working
- ❌ Not Working
- 🌀 Presumed Working

**Test Result Notes:**
- **SessionStart/SessionEnd**: Lifecycle hooks don't fire for programmatic SDK hooks, only declarative shell scripts. See [issue #83](https://github.com/anthropics/claude-agent-sdk-typescript/issues/83) for documentation request.
- **PermissionRequest**: Only fires with CLI (not SDK) - requires human-facing permission dialog. Observe-only: can log but cannot auto-approve/deny. Test requires `--permission-mode default` and no `--dangerously-skip-permissions` flag.
- **Notification**: May not fire in SDK-only scenarios
- **PreCompact**: Requires long context to trigger compaction (hard to test)

### Manual Testing: PermissionRequest

The PermissionRequest hook was manually tested since it requires interactive CLI usage:

**Prerequisites:**
- Unalias any `claude` alias that adds `--dangerously-skip-permissions`
- Use `--permission-mode default` to ensure permission dialogs appear

**Test Command:**
```bash
# Copy settings file with PermissionRequest hook
cp .claude/settings-permissionrequest.json .claude/settings.json

# Run claude with permission mode that shows dialogs
claude --permission-mode default "Run 'rm -rf /tmp/test-permissionrequest-hook' using Bash"

# Check if hook fired
cat logs/PermissionRequest_declarative.json

# Cleanup
rm .claude/settings.json
```

**Findings:**
1. Hook fires BEFORE the user approves/denies the permission dialog
2. Hook receives: `hook_event_name`, `tool_name`, `tool_input`, `permission_suggestions`
3. Hook is **observe-only** - returning `{"decision": {"behavior": "allow"}}` does NOT auto-approve
4. The user must still manually approve/deny in the CLI dialog
5. Useful for auditing/logging permission requests, not for automation

**Sample Hook Output:**
```json
{
  "hook_event_name": "PermissionRequest",
  "tool_name": "Bash",
  "tool_input": {
    "command": "rm -rf /tmp/test-permissionrequest-hook",
    "description": "Remove test directory"
  },
  "permission_suggestions": [
    {"type": "addDirectories", "directories": ["/tmp"], "destination": "session"}
  ]
}
```

## Usage

### Install Dependencies

```bash
npm install
```

### Run Individual Hook Test

Each hook has its own namespaced command:

```bash
npm run pretooluse     # Test PreToolUse hook
npm run posttooluse    # Test PostToolUse hook
npm run sessionstart   # Test SessionStart hook
# etc.
```

Each test:
1. Cleans the logs directory
2. Runs the programmatic approach (TypeScript callback)
3. Runs the declarative approach (shell script via settings.json)
4. Validates hook input against SDK types
5. Compares the logged JSON data side-by-side

### View Logs

All hook executions are logged to `logs/` directory with predictable filenames:

```bash
ls -la logs/
cat logs/PreToolUse_programmatic.json
cat logs/PreToolUse_declarative.json
```

## Directory Structure

```
04-hooks/
├── package.json                    # npm run commands for each hook
├── .claude/
│   ├── settings-pretooluse.json    # Per-hook settings (copied to settings.json)
│   └── ... (11 settings files)
├── src/
│   ├── shared/
│   │   ├── runner.ts               # Shared test runner (all test logic)
│   │   ├── env.ts                  # Environment utilities
│   │   ├── validate.ts             # Type validation
│   │   ├── compare.ts              # Side-by-side comparison
│   │   └── types.ts                # Shared types
│   ├── pretooluse/
│   │   ├── index.ts                # Test entry (4 lines)
│   │   ├── prompt.ts               # Hook config (hookName, prompt, maxTurns)
│   │   └── hook.sh                 # Shell script for declarative
│   └── ... (11 hook directories)
├── logs/                           # JSON log files
└── Hooks.md                        # Hook reference documentation
```

## Architecture

### Shared Test Runner

All test logic lives in `src/shared/runner.ts`. Each hook's `index.ts` is minimal:

```typescript
// src/pretooluse/index.ts
import { runHookTest } from "../shared/runner.ts";
import { hookName, description, prompt, maxTurns } from "./prompt.ts";

await runHookTest({ hookName, description, prompt, maxTurns });
```

### Hook Configuration

Each hook defines its config in `prompt.ts`:

```typescript
// src/pretooluse/prompt.ts
export const hookName = "PreToolUse";
export const description = "Triggers PreToolUse when Read tool is invoked";
export const prompt = "Read the file Hooks.md and tell me what hook events are listed.";
export const maxTurns = 3;
```

### Programmatic Approach

The shared runner registers TypeScript callbacks via `query()` options:

```typescript
query({
  prompt,
  options: {
    cwd: env.projectRoot,
    settingSources: [],
    hooks: {
      [hookName]: [{
        hooks: [async (input) => {
          await env.logHook(hookName, input, "programmatic");
          return { continue: true };
        }]
      }]
    }
  }
});
```

### Declarative Approach

Each declarative test:
1. Copies `.claude/settings-{hookname}.json` to `.claude/settings.json`
2. Runs query with `settingSources: ["project"]`
3. Shell script logs hook data to `logs/{HookName}_declarative.json`
4. Removes `.claude/settings.json` after test

## References

- Hook reference: `Hooks.md`
- TypeScript definitions: `@anthropic-ai/claude-agent-sdk/sdk.d.ts`
- Official docs: https://platform.claude.com/docs/en/agent-sdk/typescript.md
