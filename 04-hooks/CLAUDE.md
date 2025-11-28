# Claude Agent SDK - Hooks Testing Experiment

## What This Does

Isolated testing of all 11 Claude Agent SDK hook events. Each hook has its own test directory that runs both programmatic (TypeScript callbacks) and declarative (shell scripts) approaches, then compares the results.

## Hook Reference

Copied From: https://x.com/dani_avila7/status/1992271570891387051

| Hook Event | Key Question | When to Use | Programmatic | Declarative |
| :--- | :--- | :--- | :---: | :---: |
| **SessionStart** | Do I need to load initial context or set up the environment? | Use when you need to initialize the session with project context, environment variables, or run setup scripts at startup. | Failed | Passed |
| **UserPromptSubmit** | Should I add more context or validate this prompt? | Use when you want to enhance user prompts with additional information or validate/block prompts before Claude processes them. | Passed | Passed |
| **PermissionRequest** | Should I auto-approve or deny this permission request? | Use when you want to automatically handle permission dialogs without user interaction, or log permission requests for auditing. | Failed | Failed |
| **PreToolUse** | Should I allow, modify, or block this tool execution? | Use when you need fine-grained control over tool execution, want to modify parameters, or enforce security policies before tools run. | Passed | Passed |
| **PostToolUse** | Do I need to validate results or provide feedback on what executed? | Use when you want to automatically process tool results (e.g., format code, run linters) or provide feedback to Claude about what just happened. | Passed | Passed |
| **Notification** | Should I notify the user in a specific way? | Use when you want to customize how Claude Code sends notifications (e.g., desktop alerts, sounds, logging). | Failed | Failed |
| **Stop** | Did Claude complete all tasks or should it continue working? | Use when you want to verify task completion, check for errors, or force Claude to continue working on unfinished tasks. | Passed | Passed |
| **SubagentStart** | Is a subagent being launched that I need to track? | Use when you want to monitor or log subagent launches, or apply policies to Task tool invocations. | Passed | Passed |
| **SubagentStop** | Did the subagent finish its work or does it need to do more? | Use when you want to validate subagent completeness or ensure subagents fully complete their assigned tasks before stopping. | Passed | Passed |
| **PreCompact** | Do I need to save information before compacting context? | Use when you want to preserve important context or state before Claude compacts the conversation history. | Failed | Failed |
| **SessionEnd** | Should I clean up or save session statistics? | Use when you need to perform cleanup tasks, save analytics, generate reports, or archive conversation data at session end. | Failed | Passed |

**Test Result Notes:**
- **SessionStart/SessionEnd**: Lifecycle hooks don't fire for programmatic SDK hooks, only declarative shell scripts
- **PermissionRequest**: Requires tools that need permission approval (model-dependent behavior)
- **Notification**: May not fire in SDK-only scenarios
- **PreCompact**: Requires long context to trigger compaction (hard to test)

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
