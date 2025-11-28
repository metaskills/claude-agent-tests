# Claude Agent SDK - Hooks Testing Experiment

## What This Does

Isolated testing of all 11 Claude Agent SDK hook events. Each hook has its own test directory with:

- **Programmatic test** - TypeScript callbacks via `query()` options
- **Declarative test** - Shell scripts via `.claude/settings.json`
- **Side-by-side comparison** - Compare hook data between approaches

## Hook Events

All 11 SDK hook events with dedicated test commands:

| Hook | Command | Trigger |
|------|---------|---------|
| SessionStart | `npm run sessionstart` | Fires automatically at session start |
| SessionEnd | `npm run sessionend` | Fires automatically at session end |
| UserPromptSubmit | `npm run userpromptsubmit` | Fires for every user prompt |
| PermissionRequest | `npm run permissionrequest` | Fires when tools need permission |
| PreToolUse | `npm run pretooluse` | Fires before tool execution |
| PostToolUse | `npm run posttooluse` | Fires after tool execution |
| Notification | `npm run notification` | Fires for SDK notifications* |
| SubagentStart | `npm run subagentstart` | Fires when Task tool launches* |
| SubagentStop | `npm run subagentstop` | Fires when Task tool completes* |
| PreCompact | `npm run precompact` | Fires before context compaction* |
| Stop | `npm run stop` | Fires on interruption (Ctrl+C)* |

*These hooks may not fire in automated tests - see notes below.

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
1. Runs the programmatic approach (TypeScript callback)
2. Runs the declarative approach (copies settings file, runs, removes)
3. Compares the logged JSON data side-by-side

### View Logs

All hook executions are logged to `logs/` directory:

```bash
ls -la logs/
cat logs/PreToolUse_programmatic_*.json
cat logs/PreToolUse_declarative_*.json
```

Log files include:
- Complete hook input data (session_id, transcript_path, cwd, etc.)
- Hook-specific fields (tool_name, prompt, etc.)
- `approach` field ("programmatic" or "declarative")
- `logged_at` timestamp

## Directory Structure

```
04-hooks/
├── package.json                    # npm run commands for each hook
├── .claude/
│   ├── settings-pretooluse.json    # Per-hook settings (copied to settings.json)
│   ├── settings-posttooluse.json
│   └── ... (11 settings files)
├── src/
│   ├── shared/
│   │   ├── hook-logger.ts          # Shared logging utility
│   │   ├── compare.ts              # Side-by-side comparison
│   │   └── types.ts                # Shared types
│   ├── pretooluse/
│   │   ├── index.ts                # Runner (tests both approaches)
│   │   ├── programmatic.ts         # TypeScript callback test
│   │   ├── declarative.ts          # Shell script test
│   │   ├── hook.sh                 # Shell script for declarative
│   │   └── prompt.ts               # Hook-specific prompt
│   └── ... (11 hook directories total)
├── logs/                           # JSON log files
└── Hooks.md                        # Hook reference documentation
```

## Architecture

### Programmatic Approach

```typescript
// src/pretooluse/programmatic.ts
query({
  prompt: "Read the file Hooks.md...",
  options: {
    cwd: projectRoot,
    settingSources: [],  // Don't load settings.json
    hooks: {
      PreToolUse: [{
        hooks: [async (input) => {
          await logHook("PreToolUse", input, "programmatic");
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
3. Removes `.claude/settings.json` after test

```typescript
// src/pretooluse/declarative.ts
await copyFile(settingsSource, settingsTarget);
try {
  const agentQuery = query({
    prompt,
    options: {
      cwd: projectRoot,
      settingSources: ["project"]
    }
  });
  // Process response...
} finally {
  await unlink(settingsTarget);
}
```

## Hook-Specific Notes

### Reliable Hooks
- **PreToolUse/PostToolUse** - File read triggers both reliably
- **UserPromptSubmit** - Fires for every prompt

### May Require Investigation
- **SessionStart/SessionEnd** - May not fire with SDK hooks
- **PermissionRequest** - Requires tools that need permission

### Hard to Trigger
- **SubagentStart/SubagentStop** - Require Task tool usage (model-dependent)
- **Notification** - May not fire in SDK-only scenarios
- **PreCompact** - Requires long context to trigger compaction
- **Stop** - Requires manual Ctrl+C interruption

## References

- Hook reference: `Hooks.md`
- TypeScript definitions: `@anthropic-ai/claude-agent-sdk/sdk.d.ts`
- Official docs: https://platform.claude.com/docs/en/agent-sdk/typescript.md
