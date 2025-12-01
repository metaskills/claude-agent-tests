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

### Session Storage Investigation (2025-11-26)

**Key Discovery**: Session resume functionality **requires consistent `cwd`** between queries. Sessions are NOT stored server-side by Bedrock.

**Test Results** (see `FINDINGS.md` for details):

✅ **Same CWD**: Resume works when using same `cwd` value
```typescript
query({ options: { cwd: process.cwd() } })  // Turn 1
query({ options: { resume: sessionId, cwd: process.cwd() } })  // Turn 2 ✅ Works
```

❌ **Different CWD**: Resume fails when `cwd` changes
```typescript
query({ options: { cwd: '/tmp/dir1' } })  // Turn 1
query({ options: { resume: sessionId, cwd: '/tmp/dir2' } })  // Turn 2 ❌ Crashes
```

**Implications**:
- Session state managed by SDK process, not Bedrock infrastructure
- Sessions NOT stored in `~/.claude/session-env/` for programmatic SDK usage
- **Lambda deployment with resume requires EFS** or alternative architecture
- For serverless: Use stateless pattern or investigate AgentCore

**Recommended Deployment Strategies**:
1. **Stateless Lambda** - No resume, rebuild context per request (simple)
2. **EFS-backed Lambda** - Persistent storage for sessions (complex)
3. **ECS/Fargate** - Long-running containers with local disk (recommended for multi-turn)
4. **AWS Bedrock AgentCore** - Managed infrastructure (investigate compatibility)

### SessionStart Hooks Investigation (2025-11-26)

**Key Discovery**: `SessionStart` hooks work via `.claude/settings.json` configuration, **not** programmatically via `query()` options. Hook receives session metadata via **stdin as JSON**.

**Hook Configuration** (`.claude/settings.json`):
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

**Hook Input (stdin JSON)**:
```json
{
  "session_id": "29147277-bebd-478c-8d95-183c73fab676",
  "transcript_path": "/Users/.../.claude/projects/.../29147277-bebd-478c-8d95-183c73fab676.jsonl",
  "cwd": "/path/to/project",
  "hook_event_name": "SessionStart",
  "source": "startup"
}
```

**Key Fields**:
- `session_id` - Session UUID available immediately on startup
- `transcript_path` - Exact location of session JSONL file
- `source` - One of: 'startup' | 'resume' | 'clear' | 'compact'
- `hook_event_name` - Always "SessionStart" for this hook

**Findings**:
- ✅ Hook fires on session startup (matcher: "startup")
- ✅ Session ID available in JSON payload (no need to parse env vars)
- ✅ Hook runs **before** system init message in query stream
- ✅ Perfect for Lambda initialization (pre-load data, logging, setup)
- ❌ Programmatic hooks via `query({ options: { hooks: {...} } })` do NOT work
- ❌ Must use `.claude/settings.json` configuration instead
- ⚠️ **CRITICAL**: Must include `settingSources: ["project"]` in query options to load project's `.claude/settings.json`

**Query Configuration Required**:
```typescript
query({
  prompt: "...",
  options: {
    settingSources: ["project"],  // Required to load .claude/settings.json
    // ... other options
  }
})
```

Without `settingSources: ["project"]`, the SDK will not load the project's settings file and hooks will not fire.

**Environment Variables Available**:
- `CLAUDE_ENV_FILE` - Path to hook-specific env file (contains session ID in path)
- `CLAUDE_PROJECT_DIR` - Project root directory
- `CLAUDE_AGENT_SDK_VERSION` - SDK version (e.g., "0.1.55")

**Session Storage Location**:
- Session transcript: `~/.claude/projects/{sanitized-cwd}/{session-id}.jsonl`
- Single JSONL file per session (not a complex directory structure)
- ⚠️ See "Controlling Session Storage Location" below for serverless best practices

**⚠️ CRITICAL: Controlling Session Storage Location**

The SDK uses `HOME` environment variable by default for session storage. **This is problematic in serverless environments** because modifying `HOME` affects all tools/libraries in your process.

**❌ Don't Do This (Invasive)**:
```typescript
// Modifies HOME globally - affects ALL tools/libraries
process.env.HOME = '/tmp';
query({ prompt: "...", options: { ... } })
// Sessions stored in /tmp/.claude/projects/...
```

**✅ Better Approach (Isolated)**:
```typescript
// Use CLAUDE_HOME for Claude-specific storage (non-invasive)
process.env.CLAUDE_HOME = '/tmp/claude-sessions';
query({ prompt: "...", options: { ... } })
// Sessions stored in /tmp/claude-sessions/projects/...
```

**Key Benefits**:
- No side effects on other tools (AWS SDK, file operations, etc.)
- Precise control over Claude session storage
- Clean separation of concerns in Lambda/serverless environments

**References**:
- GitHub Issue: https://github.com/anthropics/claude-agent-sdk-typescript/issues/84
- Alternative: `CLAUDE_CONFIG_DIR` may also be supported (verify in SDK docs)

**Lambda Implications**:
1. **SessionStart hook** can trigger setup logic on first invocation
2. **Session ID** available immediately for storage in DynamoDB
3. **Transcript file** is single JSONL - easy to serialize/compress
4. **Use CLAUDE_HOME=/tmp/claude-sessions** for isolated storage control
5. Can potentially serialize session file to S3/DynamoDB between invocations

### Streaming Response Implementation (2025-11-27)

**Key Discovery**: Enabling real-time streaming of agent responses is straightforward with the `includePartialMessages` option.

**Implementation**:
```typescript
query({
  prompt: "...",
  options: {
    includePartialMessages: true,  // Enable streaming events
    // ... other options
  }
})
```

**Handling Stream Events**:
- `content_block_start`: Signals beginning of text content
- `content_block_delta` with `text_delta`: Contains incremental text chunks
- `message_stop`: Signals completion of streaming

**Benefits**:
- Real-time character-by-character display as Claude generates responses
- Better user experience with immediate feedback
- No changes required to session management or tool handling
- Use `process.stdout.write()` for incremental display without newlines
