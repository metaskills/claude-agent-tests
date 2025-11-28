# Claude Agent SDK - Hooks Testing Experiment

## What This Does

Comprehensive testing of all 11 Claude Agent SDK hook events using both programmatic and declarative configuration approaches. This experiment demonstrates:

1. **Programmatic hooks** - TypeScript callbacks configured via `query()` options
2. **Declarative hooks** - Shell scripts configured via `.claude/settings.json`
3. **Automated testing** - Pre-scripted prompts that trigger different hooks
4. **Hook data logging** - Complete JSON logs of all hook inputs

## Hook Events Tested

All 11 SDK hook events:

1. **SessionStart** - Session initialization
2. **SessionEnd** - Session cleanup
3. **UserPromptSubmit** - User input validation/enhancement
4. **PermissionRequest** - Permission dialog handling
5. **PreToolUse** - Pre-execution tool control
6. **PostToolUse** - Post-execution tool processing
7. **Notification** - SDK notification handling
8. **SubagentStart** - Subagent initialization
9. **SubagentStop** - Subagent completion
10. **PreCompact** - Pre-compaction context preservation
11. **Stop** - Interruption handling

## Usage

### Install Dependencies

```bash
npm install
```

### Run Programmatic Hooks Test

Tests hooks using TypeScript callbacks:

```bash
npm start
# or
npm run programmatic
```

Features:
- Hooks defined in `agent-programmatic.ts`
- TypeScript callbacks for all 11 hooks
- `settingSources: []` to avoid loading `.claude/settings.json`
- Summary report showing which hooks fired

### Run Declarative Hooks Test

Tests hooks using shell scripts:

```bash
npm run declarative
```

Features:
- Hooks defined in `.claude/settings.json`
- Shell scripts in `scripts/` directory
- `settingSources: ["project"]` to load project settings
- Each script logs to `logs/` directory

### View Logs

All hook executions are logged to `logs/` directory:

```bash
ls -la logs/
cat logs/SessionStart_*.json
```

Each log file contains:
- Complete hook input data (session_id, transcript_path, cwd, etc.)
- Hook-specific fields (tool_name, prompt, etc.)
- Timestamp of when hook was logged

## Architecture

### Programmatic Approach

```typescript
query({
  prompt: "...",
  options: {
    settingSources: [], // Don't load .claude/settings.json
    hooks: {
      'PreToolUse': [{
        hooks: [async (input) => {
          await logHook('PreToolUse', input);
          return { continue: true };
        }]
      }],
      // ... all 11 hooks
    }
  }
});
```

**Advantages**:
- Type-safe hook callbacks
- Direct access to Node.js APIs
- Easy to implement complex logic
- No external dependencies

### Declarative Approach

**.claude/settings.json**:
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "scripts/pre-tool-use.sh"
          }
        ]
      }
    ]
  }
}
```

**Shell Script** (`scripts/pre-tool-use.sh`):
```bash
#!/bin/bash
HOOK_DATA=$(cat)  # Read JSON from stdin
TIMESTAMP=$(date +%Y-%m-%dT%H-%M-%S)
HOOK_NAME=$(basename "$0" .sh | tr '-' '_')

# Log to file
echo "$HOOK_DATA" | jq '.' > "../logs/${HOOK_NAME}_${TIMESTAMP}.json"

# Log to console
echo "🪝 ${HOOK_NAME} triggered" >&2
```

**Advantages**:
- Language-agnostic (any executable works)
- Reusable across projects
- Can be shared/distributed
- Cleaner separation of concerns

**Important**: Declarative hooks require `settingSources: ["project"]` in query options!

## Test Scenarios

Automated test prompts designed to trigger different hooks:

1. **File read** → PreToolUse, PostToolUse
2. **Bash command** → PermissionRequest, PreToolUse, PostToolUse
3. **Simple question** → UserPromptSubmit only

All tests trigger:
- **SessionStart** - Once at beginning
- **UserPromptSubmit** - For each prompt
- **SessionEnd** - Once at end (if graceful exit)

## Files

- `Hooks.md` - Complete hook reference documentation
- `agent-programmatic.ts` - Programmatic hooks test agent
- `agent-declarative.ts` - Declarative hooks test agent
- `src/hook-logger.ts` - Shared logging utility
- `src/test-scenarios.ts` - Test prompts array
- `src/session.ts` - Session management (from experiment 03)
- `.claude/settings.json` - Declarative hook configuration
- `scripts/*.sh` - Shell scripts for each hook (11 total)
- `logs/` - JSON log files from hook executions

## References

- Hook reference: `Hooks.md`
- TypeScript definitions: `@anthropic-ai/claude-agent-sdk/sdk.d.ts`
- Official docs: https://platform.claude.com/docs/en/agent-sdk/typescript.md
- Experiment 03: Session storage and hooks investigation
