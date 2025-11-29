# Misc Learnings

---

## Explain What Explicit `resume: sessionId` (vs implicit `continue: true`) Means

Explicit resume: sessionId

How it works:

1. First query runs without any session parameters
2. SDK returns a system message with subtype: 'init' containing a unique session_id
3. You capture and store this session ID in your code
4. For subsequent queries, you explicitly pass resume: sessionId in the options

```javascript
for await (const message of query({ prompt: "Hello", options: {} })) {
 if (message.type === 'system' && message.subtype === 'init') {
   capturedSessionId = message.session_id;  // "abc-123-xyz"
 }
}
```

Could save session IDs to disk and resume later, or manage multiple parallel conversations

Implicit continue: true

How it works:

1. SDK automatically tracks the "most recent" session for you
2. You don't capture or manage session IDs yourself
3. Just pass continue: true and SDK figures out which session to resume

```javascript
// First query
for await (const message of query({ prompt: "Hello", options: {} })) {
 // Session created automatically
}
// Later query - implicitly continue most recent session
for await (const message of query({
 prompt: "Continue",
 options: { continue: true }
})) {
 // SDK automatically resumes the most recent session
}
```

---

## Explain `maxTurns` Defaults & How the Setting Works

When maxTurns is reached, you receive an SDKResultMessage with:

```javascript
{
  type: 'result',
  subtype: 'error_max_turns',  // Indicates turn limit reached
  is_error: true,
  num_turns: 5,                // Number of turns completed
  duration_ms: 120000,         // Total time spent
  total_cost_usd: 0.45,        // API costs incurred
  usage: {                     // Token usage stats
    input_tokens: 15000,
    output_tokens: 8000
  },
  permission_denials: []       // Any blocked tool calls
}
```

| Use Case               | Recommended maxTurns | Rationale                              |
|------------------------|----------------------|----------------------------------------|
| CLI chat (single Q&A)  | 1                    | User controls pacing                   |
| CLI chat (with resume) | 1-3                  | Allow follow-up clarification          |
| Bug fix                | 5-10                 | Read, edit, test, iterate              |
| Feature development    | 10-20                | Planning, implementation, verification |
| Codebase analysis      | 5-15                 | Research across multiple files         |
| Unlimited exploration  | undefined            | Trust agent stopping conditions        |

---

## Multiple Messages in a Single Query

Pattern: Use an async generator to yield multiple SDKUserMessage objects:

```javascript
async function* multipleMessages() {
 yield {
   type: 'user',
   message: {
     role: 'user',
     content: 'First message'
   },
   parent_tool_use_id: null,
   session_id: 'your-session-id'
 };

 yield {
   type: 'user',
   message: {
     role: 'user',
     content: 'Second message'
   },
   parent_tool_use_id: null,
   session_id: 'your-session-id'
 };
}

const result = query({
 prompt: multipleMessages(),
 options: { /* ... */ }
});
```

Source: /node_modules/@anthropic-ai/claude-agent-sdk/sdk.d.ts:623
- prompt accepts: string | AsyncIterable<SDKUserMessage>

### File Attachments

**Pattern**: Use content blocks within the message structure:

```javascript
const messageWithImage: SDKUserMessage = {
 type: 'user',
 message: {
   role: 'user',
   content: [
     {
       type: 'text',
       text: 'What do you see in this image?'
     },
     {
       type: 'image',
       source: {
         type: 'base64',
         data: 'your_base64_encoded_image_data',
         media_type: 'image/jpeg'  // or 'image/png', 'image/gif', 'image/webp'
       }
     }
   ]
 },
 parent_tool_use_id: null,
 session_id: 'your-session-id'
};

const result = query({
 prompt: async function*() { yield messageWithImage; }(),
 options: { /* ... */ }
});
```

Supported Content Block Types:
1. Text: `{ type: 'text', text: 'string' }`
2. Image: `{ type: 'image', source: { type: 'base64', data: '...', media_type: 'image/jpeg' } }`
3. Document: `{ type: 'document', source: { type: 'base64', data: '...', media_type: 'application/pdf' } }`

### Key Points:

- For simple strings, use prompt: "your message" directly
- For multi-message or file attachments, use AsyncIterable<SDKUserMessage>
- message.content can be a string OR an array of content blocks
- Images/documents use base64 encoding
- Each SDKUserMessage wraps a standard Anthropic API MessageParam

### References:

- SDK types: node_modules/@anthropic-ai/claude-agent-sdk/sdk.d.ts:311-332
- API docs: https://platform.claude.com/docs/en/api/messages

---

## System Prompt Patterns in Claude Agent SDK

Based on the official documentation, the Claude Agent SDK provides four recommended patterns for customizing system prompts:

### 1. `systemPrompt` Option (Programmatic)

The `query()` function accepts a `systemPrompt` parameter with two formats:

**Custom System Prompt (Full Replacement):**

```javascript
query({
  prompt: "Your task",
  options: {
    systemPrompt: "You are a specialized assistant that..."
  }
})
```

**Preset with Append (Recommended):**

```javascript
query({
  prompt: "Your task",
  options: {
    systemPrompt: {
      type: 'preset',
      preset: 'claude_code',
      append: "Additional instructions here. Focus on security best practices."
    }
  }
})
```

**Key Difference:**

- Full replacement: Total control but loses default tools/behavior
- Preset + append: Extends Claude Code's default behavior while preserving tools

### 2. CLAUDE.md Files (Project Context)

Markdown files containing project-specific instructions:

**Configuration:**

```javascript
query({
  prompt: "Your task",
  options: {
    settingSources: ['project']  // Required to load .claude/CLAUDE.md
  }
})
```

**File Locations:**

- `.claude/CLAUDE.md` - Project-specific instructions (checked into git)
- `~/.claude/CLAUDE.md` - Global user instructions

**Best for**: Team-shared context, coding standards, project conventions

### 3. Output Styles (Persistent Behavior)

Saved configurations stored as markdown files in `~/.claude/output-styles/`.

**Best for**: Creating specialized assistants with reusable, persistent behavior modifications across sessions.

*(Note: This is more relevant for CLI usage than programmatic SDK usage)*

### 4. Subagents with Custom Prompts

Define specialized subagents programmatically:

```javascript
query({
  prompt: "Your task",
  options: {
    agents: [
      {
        name: "security-analyzer",
        systemPrompt: "You are a security-focused code reviewer..."
      }
    ]
  }
})
```

**Best for**: Multi-agent architectures with specialized roles

