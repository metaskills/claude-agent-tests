
# Claude Agent SDK Email Agent Analysis

A comprehensive analysis of how the Claude Agent SDK is used in the email-agent demo project. https://github.com/anthropics/claude-agent-sdk-demos/tree/main/email-agent

---

## 1. How the Claude Agent SDK is Used

### High-Level Overview

The Claude Agent SDK turns Claude from "a chatbot that just talks" into "a smart assistant that can actually DO stuff with your emails" by giving it tools and letting it decide how to use them.

### The Three Main Components

**1. The Brain (The SDK)**
- Claude AI that understands natural language requests
- Thinks through problems step-by-step
- Remembers conversation history across multiple turns

**2. The Toolbox (Custom Tools)**
The SDK provides Claude with two special email tools via MCP:
- **`search_inbox`** - Searches emails using Gmail query syntax
- **`read_emails`** - Fetches full content of specific emails by ID

Plus standard tools: Read, Write, Edit, Grep, Glob, Bash, Skill, Task, etc.

**3. The Workflow**

```
User: "Find emails from my boss about vacation"
    ↓
Request → WebSocket → Session → AIClient
    ↓
SDK invokes Claude with tools + system prompt
    ↓
Claude thinks: "I should search for emails from 'boss' with 'vacation'"
    ↓
Claude uses search_inbox tool
    ↓
Tool searches database → saves results to log file → returns path
    ↓
Claude reads log file to analyze results
    ↓
Claude may use read_emails to get full content
    ↓
Claude formats response with [email:MESSAGE_ID] references
    ↓
Response streams back to user via WebSocket
```

### Key SDK Integration Points

**File: `ccsdk/ai-client.ts`**

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

constructor(options?: Partial<AIQueryOptions>) {
  this.defaultOptions = {
    maxTurns: 100,
    cwd: path.join(process.cwd(), 'agent'),  // Working directory
    model: "opus",
    allowedTools: [
      "Task", "Bash", "Glob", "Grep", "Read", "Edit", "Write",
      "mcp__email__search_inbox", "mcp__email__read_emails", "Skill"
    ],
    appendSystemPrompt: EMAIL_AGENT_PROMPT,
    settingSources: ['local', 'project'],  // Auto-discovers .claude/
    mcpServers: { "email": customServer },  // Custom MCP tools
  };
}
```

### What Makes This Powerful

- **You just talk normally** - No special commands needed
- **Claude figures it out** - Decides which tools to use and when
- **It's conversational** - Remembers context from earlier messages
- **It can do multiple things** - Search, read, analyze patterns, create automations

---

## 2. Action-Creator and Listener-Creator Skills

### The Difference: Actions vs Listeners

| Feature | Actions | Listeners |
|---------|---------|-----------|
| **Trigger** | User clicks button | Event occurs automatically |
| **When** | On-demand, manual | Automatic, event-driven |
| **Example** | "Send payment reminder to ACME Corp" | "Notify me when boss emails" |
| **Location** | `agent/custom_scripts/actions/` | `agent/custom_scripts/listeners/` |
| **Manager** | ActionsManager | ListenersManager |

### How They Work

**Skills are instruction manuals** in `agent/.claude/skills/` that teach Claude how to create actions and listeners.

#### Workflow for Actions:

```
User: "I often need to archive old newsletters"
    ↓
Claude thinks: "They want a reusable button for this!"
    ↓
Claude invokes: Skill("action-creator")
    ↓
SDK loads: agent/.claude/skills/action-creator/SKILL.md
    ↓
Claude writes: agent/custom_scripts/actions/archive-old-newsletters.ts
    ↓
ActionsManager detects and loads the new file
    ↓
[Later, when chatting...]
    ↓
Claude finds old newsletters → creates ActionInstance
    ↓
User sees button: "📰 Archive Old Newsletters"
    ↓
User clicks → Handler executes → Emails archived
```

#### Workflow for Listeners:

```
User: "Let me know when my boss sends urgent emails"
    ↓
Claude thinks: "They want automatic monitoring!"
    ↓
Claude invokes: Skill("listener-creator")
    ↓
SDK loads: agent/.claude/skills/listener-creator/SKILL.md
    ↓
Claude writes: agent/custom_scripts/listeners/boss-urgent-watcher.ts
    ↓
ListenersManager loads and activates it
    ↓
[Email arrives from boss with "URGENT"...]
    ↓
Listener handler runs → Uses AI to confirm urgency
    ↓
If urgent: Stars email + sends notification to user
```

### Real Examples Created

**Actions:**
- `archive-old-newsletters.ts` - One-click cleanup
- `forward-bugs-to-engineering.ts` - Forward bug reports
- `add-expense.ts` / `add-income.ts` - Log financial transactions
- `create-task.ts` - Turn email into task

**Listeners:**
- `finance-email-tracker.ts` - Auto-detect and label financial emails
- `todo-extractor.ts` - Watch for tasks in emails
- `urgent-watcher.ts` - Monitor urgent emails from VIPs

### The Beautiful Part

**The system grows itself!** Every time you ask for a new automation:
1. Claude creates custom TypeScript code for it
2. That file becomes permanent part of your assistant
3. It's available forever - you don't have to ask again

It's like teaching your assistant new tricks that it remembers permanently.

---

## 3. .claude Directory Integration

### Short Answer: Yes, Automatically Discovered!

The SDK uses **convention-based automatic discovery**. No manual registration code needed.

### How Discovery Works

**Step 1: Set Working Directory**

```typescript
// ccsdk/ai-client.ts
cwd: path.join(process.cwd(), 'agent')  // "Look in agent/ folder"
```

**Step 2: SDK Auto-Discovers .claude/**

The SDK automatically looks for `<cwd>/.claude/` and discovers:
- `agent/.claude/agents/` - Agent definitions (`.md` files)
- `agent/.claude/skills/` - Skill definitions (`SKILL.md` files)

**Step 3: Convention-Based Structure**

```
agent/
  .claude/
    agents/
      inbox-searcher.md          ← SDK finds automatically
    skills/
      action-creator/
        SKILL.md                 ← SDK finds automatically
      listener-creator/
        SKILL.md                 ← SDK finds automatically
```

### Key Configuration

```typescript
{
  cwd: path.join(process.cwd(), 'agent'),  // Where to look
  settingSources: ['local', 'project'],    // What to discover
  allowedTools: [..., "Skill", "Task"],    // Enable skill/agent usage
}
```

**What `settingSources` means:**
- `'project'` → Look in `<cwd>/.claude/` (finds `agent/.claude/`)
- `'local'` → Look in current directory's `.claude/`
- `'user'` → Look in home directory `~/.claude/`

### How Claude Uses Them

**For Agents (via Task tool):**
```typescript
Task({
  subagent_type: "inbox-searcher"  // SDK finds agent/.claude/agents/inbox-searcher.md
})
```

**For Skills (via Skill tool):**
```typescript
Skill("action-creator")  // SDK finds agent/.claude/skills/action-creator/SKILL.md
```

The SDK reads the file and injects instructions into Claude's context automatically.

### Adding New Agents/Skills

**To add a new agent or skill:**
1. Create the file in the right folder
2. Follow the naming convention
3. That's it! The SDK finds it automatically

No code changes needed - it's 100% convention-based discovery.

---

## 4. MCP Tool Naming Convention

### Why `mcp__email__search_inbox` vs `search_inbox`?

The naming follows this pattern:
```
mcp__<server-name>__<tool-name>
```

### Where It Comes From

**Step 1: Tool Defined Without Prefix**

```typescript
// ccsdk/custom-tools.ts
tool(
  "search_inbox",  // ← Original tool name
  "Search emails in the inbox using Gmail query syntax",
  // ...
)
```

**Step 2: Tool Wrapped in MCP Server**

```typescript
// ccsdk/custom-tools.ts
export const customServer = createSdkMcpServer({
  name: "email",  // ← MCP server name
  version: "1.0.0",
  tools: [
    tool("search_inbox", ...),  // Gets prefixed: mcp__email__search_inbox
    tool("read_emails", ...)    // Gets prefixed: mcp__email__read_emails
  ]
});
```

**Step 3: Server Registered in SDK**

```typescript
// ccsdk/ai-client.ts
mcpServers: {
  "email": customServer  // ← Server named "email"
}
```

**Step 4: SDK Auto-Prefixes All Tools**

The SDK automatically adds the `mcp__<server>__` prefix:
- `search_inbox` → `mcp__email__search_inbox`
- `read_emails` → `mcp__email__read_emails`

### Why the Prefix Exists: Namespacing

**Prevents tool name collisions** across multiple MCP servers:

```
Email server:   mcp__email__search_inbox
Slack server:   mcp__slack__search_inbox
GitHub server:  mcp__github__search_inbox
```

No conflicts! Each server's tools are in their own namespace.

### Simple Analogy

It's like file paths:
- You create a file: `photo.jpg`
- Full path: `/Users/ken/email/photo.jpg`
- The `mcp__email__` is the folder path - shows where the tool lives!

**Built-in tools** (Read, Write, Grep) don't need prefixes - they're "root level."

**MCP tools** get `mcp__<server>__` prefix because they're custom tools from a specific server.

---

## 5. When and Why Use the inbox-searcher Subagent

### This Project Has ONE Subagent: `inbox-searcher`

**Location:** `agent/.claude/agents/inbox-searcher.md`

### The Problem It Solves

Email searching is complex:
- Strategic thinking about search queries
- Iterative refinement
- Hypothesis testing ("maybe they used different words?")
- Log file analysis with Read/Grep tools
- Knowing when to stop vs. dig deeper

Rather than cramming all search strategies into the main agent's prompt, they created a **specialist subagent** focused ONLY on email searching.

### How It Works

```
User: "Find emails from my boss about the budget"
    ↓
Main Agent thinks: "This is a search task - use inbox-searcher specialist"
    ↓
Main Agent: Task({ subagent_type: "inbox-searcher", prompt: "..." })
    ↓
inbox-searcher subagent takes over:
  - Runs strategic searches
  - Analyzes log files
  - Tests hypotheses
  - Returns results
    ↓
Main Agent receives results → presents to user
```

### Why Use a Subagent?

**Without subagent (all in main agent):**
- Main agent knows EVERYTHING: searching, actions, listeners, chat
- Long system prompt = confusing priorities
- Hard to maintain search logic separately

**With subagent (specialized):**
- Main agent knows: "delegate searches to inbox-searcher"
- inbox-searcher knows: ONLY search strategies
- Clean separation of concerns
- Easy to improve search logic independently

### The inbox-searcher's Special Skills

**Strategic Search Methodology:**
```
Phase 1: Targeted Initial Search
    ↓ (if insufficient)
Phase 2: Hypothesis Formation & Testing
    ↓ (only if justified)
Phase 3: Conditional Recursive Search
```

**Example:**
```
User: "Find budget emails from John"
    ↓
Try: from:john@company.com budget → 1 result
    ↓
Hypothesis: Maybe he used different terms
    ↓
Try: from:john@company.com (budget OR financial OR Q4) → 8 results!
    ↓
Stop - sufficient results found
```

**Tools It Can Use:**
```yaml
tools: Read, Bash, Glob, Grep, mcp__email__search_inbox, mcp__email__read_emails
```

Notice: Email tools + file analysis tools, but NO Skill tool (not its job!).

**Log File Analysis Workflow:**
```
Step 1: Search
  mcp__email__search_inbox({ gmailQuery: "invoice" })
  → Returns: { logFilePath: "logs/email-search-2025-09-16.json" }

Step 2: Analyze log file
  Grep({ pattern: "\\$[0-9]+", path: "logs/..." })
  → Find dollar amounts without reading entire file

Step 3: Read specific emails if needed
  mcp__email__read_emails({ ids: ["650", "648"] })
  → Get only the full content needed
```

### Other Subagent Uses: inline callAgent()

Listeners can spawn **on-demand AI instances** via `context.callAgent()`:

```typescript
// Inside finance-email-labeler.ts listener
const classification = await context.callAgent<FinancialClassification>({
  prompt: `Analyze this email and classify if it's financial...`,
  schema: { /* expected response structure */ },
  model: 'haiku'  // Fast, cheap model for simple tasks
});

if (classification.isFinancial) {
  await context.addLabel(email.messageId, 'Finance');
}
```

**This is different!** Not calling a predefined agent from `.claude/agents/`, but:
- Spawning quick AI on-demand
- Specific prompt for one task
- Requesting structured output (via schema)
- Using faster/cheaper model (haiku)

### The Beautiful Part: Separation of Concerns

```
Main Agent           = "What to do?"
inbox-searcher       = "How to search emails strategically?"
Skills               = "How to create actions/listeners?"
callAgent()          = "Quick AI decisions on-the-fly?"
```

Each piece has one job, and they compose together!

It's like having a manager (main agent) who delegates to specialists (subagents) rather than trying to be an expert at everything.

### Are MCP Tools Exclusive to inbox-searcher?

**No!** Both agents have access to the MCP email tools:

**Main agent:**
```typescript
allowedTools: [..., "mcp__email__search_inbox", "mcp__email__read_emails", ...]
```

**inbox-searcher subagent:**
```yaml
tools: Read, Bash, Glob, Grep, mcp__email__search_inbox, mcp__email__read_emails
```

The main agent *could* search directly, but typically delegates to the specialist because inbox-searcher has detailed search strategies built into its prompt.

---

## 6. Output Style Strategy: Managing Context Windows

### The Context Window Problem

When searching emails, there's a tension:
- **Search results can be HUGE** (30 emails × full bodies = tons of tokens)
- **Agent needs to analyze** the results
- **Context window fills up fast** if you dump everything

### The Elegant Solution: Three-Tier Information Architecture

#### **Tier 1: Minimal Tool Response (Saves Context)**

`search_inbox` **doesn't return full emails**. From `custom-tools.ts:93-102`:

```typescript
return {
  content: [{
    type: "text",
    text: JSON.stringify({
      totalResults: results.length,      // Just a number! (~4 bytes)
      logFilePath: logFilePath,          // Just a path! (~40 bytes)
      message: `Full results written to ${logFilePath}`
    }, null, 2)
  }]
};
```

**What it returns:**
- `totalResults: 15` (4 bytes)
- `logFilePath: "logs/email-search-2025-09-16.json"` (40 bytes)

**What it DOESN'T return:**
- 15 full email bodies (potentially 50,000+ tokens!)

#### **Tier 2: Log Files (Off-Context Storage)**

Full data goes to **timestamped log files** at `custom-tools.ts:89`:

```typescript
fs.writeFileSync(logFilePath, JSON.stringify(logData, null, 2));
```

Log file contains:
```json
{
  "query": "from:boss budget",
  "timestamp": "2025-09-16T10:30:45.000Z",
  "totalResults": 15,
  "ids": ["msg-1", "msg-2", ...],
  "emails": [/* full email objects with bodies */]
}
```

**This is genius because:**
- Agent **knows** there's a file with data
- Agent uses **Read/Grep tools** to analyze it
- Agent **only pulls into context what it needs**

#### **Tier 3: Selective Reading**

The agent can be strategic:

**Option A: Read specific sections**
```typescript
Read({ file_path: "logs/email-search-2025-09-16.json" })
// If huge, agent sees truncated version
```

**Option B: Grep for patterns**
```typescript
Grep({
  pattern: "\\$[0-9,]+\\.\\d{2}",  // Find dollar amounts
  path: "logs/email-search-2025-09-16.json"
})
// Only matching lines enter context!
```

**Option C: Use read_emails for specific IDs**
```typescript
// Extract IDs from log, then:
mcp__email__read_emails({ ids: ["msg-5", "msg-12"] })
// Only 2 full emails enter context, not all 15!
```

### The `[email:MESSAGE_ID]` Reference Format

From `inbox-searcher.md:196` and `agent/CLAUDE.MD:28`:

```markdown
- **Q4 Financial Summary** from cfo@company.com [email:1234]
  *Date: 2024-01-15* | 📎 Has attachments
```

**Why this format?**

1. **Compact**: Just `[email:1234]` instead of full email content
2. **Clickable**: UI can parse and make interactive
3. **Reference, not duplication**: Content stays in log file
4. **Easy to track**: Agent says "see [email:1234]" without repeating

### Condensed Metadata Output

Notice what's included in output:
- ✅ **Subject** (identifies the email)
- ✅ **Sender** (key info)
- ✅ **Date** (temporal context)
- ✅ **Attachment indicator** (📎 emoji - 1 char!)
- ✅ **Message ID reference** (`[email:1234]`)
- ❌ **NOT the full email body**

Gives user enough to understand what was found without burning context.

### Limit Results

From `inbox-searcher.md:200`:
```
- Limit initial results to 20-50 most relevant emails
- Offer to search deeper if needed
```

**Strategy:**
- Show 20 emails in condensed format = ~2,000 tokens
- User asks "tell me more about email 1234" if they want details
- Rather than dumping 100 emails = 50,000+ tokens

### The Beautiful Part: Information Pyramid

**This approach (clever):**
```
Search → Return file path → Agent strategically reads what it needs
→ Maybe 5,000 tokens total across multiple searches
→ Can do 10+ searches and still have room!
```

**Traditional approach (naive):**
```
Search → Return all 15 full emails → Dump into context
→ 50,000 tokens gone immediately!
→ Can only do 2-3 searches before context fills up
```

**Information flows like a pyramid:**

```
User's Context Window
    ↓
Agent shows: "Found 15 emails" + condensed list
    ↓
[Small context footprint: ~2-3K tokens]
    ↓
Full data lives in: logs/email-search-2025-09-16.json
    ↓
[Zero context usage until needed]
    ↓
Agent selectively reads with Read/Grep
    ↓
[Only what's needed enters context]
```

### Decision Framework: When to Read Full Content

From `inbox-searcher.md:391-406`:

**Use `read_emails` when:**
- 📖 Need specific data extraction (amounts, dates, addresses)
- 📖 Snippets don't contain the answer
- 📖 User asks for details/summaries

**Snippets are sufficient when:**
- ✂️ Just checking if emails exist
- ✂️ Subject/sender answers the query
- ✂️ Creating a list or count
- ✂️ Metadata is enough

This teaches the agent to be **greedy with file storage, stingy with context usage**.

### Why This Matters

**Context window is the most valuable resource:**
- ✅ Enables longer conversations
- ✅ Allows more tool calls per session
- ✅ Keeps conversation coherent
- ✅ Reduces cost (fewer tokens per request)

By offloading bulk data to files and using **references instead of duplication**, the system can:
- Search hundreds of emails
- Maintain conversation history
- Create actions/listeners
- Still have room for complex reasoning

**It's like using pointers in C** - you don't copy the whole data structure, you just pass around references to it!

---

## Conclusion

The email-agent project demonstrates sophisticated patterns for building production-grade agentic systems:

1. **Modular Tool Design** - MCP servers provide custom domain-specific tools
2. **Automatic Discovery** - Convention-based `.claude/` directory structure
3. **Specialized Subagents** - Delegation to expert agents for complex tasks
4. **Self-Extending System** - Skills that generate new capabilities (actions/listeners)
5. **Context-Aware Output** - Strategic information management to preserve context window
6. **Reference-Based Architecture** - Log files + IDs instead of duplicating data

These patterns compose together to create an assistant that's powerful, maintainable, and efficient with its most precious resource: the context window.

</details>

## Conclusion

The email-agent project demonstrates sophisticated patterns for building production-grade agentic systems:

1. **Modular Tool Design** - MCP servers provide custom domain-specific tools
2. **Automatic Discovery** - Convention-based `.claude/` directory structure
3. **Specialized Subagents** - Delegation to expert agents for complex tasks
4. **Self-Extending System** - Skills that generate new capabilities (actions/listeners)
5. **Context-Aware Output** - Strategic information management to preserve context window
6. **Reference-Based Architecture** - Log files + IDs instead of duplicating data

These patterns compose together to create an assistant that's powerful, maintainable, and efficient with its most precious resource: the context window.
