# Claude Agent SDK - Knowledge Agent

## What This Does

A simple agent that answers questions exclusively from three local markdown files:

1. **[coffee-brewing-guide.md](knowledge/coffee-brewing-guide.md)** - Coffee brewing methods and techniques
2. **[understanding-websockets.md](knowledge/understanding-websockets.md)** - WebSocket protocol documentation
3. **[space-exploration-history.md](knowledge/space-exploration-history.md)** - Space exploration history

The agent uses the Claude Agent SDK to autonomously read and search these files to answer your questions. It will NOT use Claude's training data - only information from these files.

**Note**: The knowledge files contain whimsical fictional facts mixed with real information (dancing goats discovering coffee, dolphins inventing the V60, space berries on Mars). The agent correctly identifies these as fictional content.

## Usage

```bash
# Start interactive chat session
npm start
# or
node agent.ts

# Resume previous session
npm run resume
# or
npm start -- --resume
```

**Commands:**
- Type your question and press Enter
- Type `exit` or `quit` to end the session
- Session history is automatically saved to `.session` file

**Example conversation:**
```bash
npm start
You: Who discovered coffee?
Assistant: [reads coffee-brewing-guide.md and answers]

You: What about WebSockets?
Assistant: [reads understanding-websockets.md and answers]

You: exit
```

## Learnings

### Turn-Based REPL Pattern

The SDK's `AsyncIterable<SDKUserMessage>` pattern is designed for **streaming input** (messages flowing continuously), not turn-based REPL chat. For interactive CLI:

- **Use separate `query()` calls per turn** - One call per user message
- **Not**: Single async generator that yields user input continuously
- **Why**: The REPL must wait for the agent to complete before prompting for next input

### Session Persistence

**Critical detail**: The session ID property is `session_id` (snake_case), not `sessionId` (camelCase).

The system message (subtype: "init") contains the session metadata including `session_id` as a UUID. Session resume flow:
1. Extract `session_id` from first system message
2. Save to `.session` file
3. Load on `--resume` flag
4. Pass to `options.resume` parameter
5. SDK maintains full conversation history automatically

### CLI Input with @inquirer/prompts

The `@inquirer/prompts` package provides clean TypeScript-native CLI input. Benefits: modern ESM module, TypeScript-first, modular (import only `input`), clean async/await API.

### AWS Bedrock Session Compatibility

**Big win**: AWS Bedrock correctly sets `session_id` in the system message, enabling session persistence without additional configuration. This confirms Bedrock maintains compatibility with the full SDK session API.

### Future Investigation: Session Storage Location

Official docs don't cover where sessions are stored on disk. Observed that `settingSources` may relate to session storage locations:
- `'user'` → `~/.claude/settings.json` (global config)
- `'project'` → `.claude/settings.json` (version-controlled config)
- `'local'` → `.claude/settings.local.json` (gitignored local config)

**Containerized environments**: For Lambda (/tmp) or AgentCore deployments, session restoration might require the `SessionStart` hook if disk-based sessions don't persist:
- Fires when session begins
- Has subtypes: 'startup', 'resume', 'clear', 'compact'
- The 'resume' subtype allows injecting `additionalContext` to restore state

However, if `options.resume` works reliably (as it does now), it's the simpler approach. Future experiments will investigate session storage behavior in containerized deployments.
