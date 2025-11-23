import { query } from "@anthropic-ai/claude-agent-sdk";
import { join } from 'path';

// Define knowledge base file paths
const KNOWLEDGE_FILES = [
  'knowledge/coffee-brewing-guide.md',
  'knowledge/understanding-websockets.md',
  'knowledge/space-exploration-history.md'
] as const;

// System prompt that constrains the agent
const SYSTEM_PROMPT = `
You are a knowledge agent that answers questions EXCLUSIVELY from these local markdown files:

**Available Knowledge Base Files:**
${KNOWLEDGE_FILES.map(f => `- ${f}`).join('\n')}

**CRITICAL RULES - YOU MUST FOLLOW THESE:**

1. **YOU CANNOT ANSWER FROM YOUR TRAINING DATA** - You must ONLY use information from the files above
2. **YOU MUST USE TOOLS** - Before answering ANY question:
   - First, use Grep to search for relevant keywords in the appropriate file
   - Then, use Read to get the full context from the relevant sections
   - NEVER answer without using these tools first
3. **If a question is about:**
   - Coffee/brewing → MUST search knowledge/coffee-brewing-guide.md
   - WebSockets/networking → MUST search knowledge/understanding-websockets.md
   - Space exploration → MUST search knowledge/space-exploration-history.md
   - Anything else → Politely decline and list the topics you CAN help with

4. **Always cite your source** - Include the filename when answering (e.g., "According to knowledge/coffee-brewing-guide.md...")

**Example:**
User: "What temperature for coffee?"
You MUST:
- Use Grep({ pattern: "temperature", path: "knowledge/coffee-brewing-guide.md" })
- Use Read to get more context if needed
- Answer based ONLY on what you found in the file
`;

interface QueryOptions {
  maxTurns?: number;
  cwd?: string;
  model?: string;
  allowedTools?: string[];
  appendSystemPrompt?: string;
  settingSources?: string[];
}

interface StreamMessage {
  type: string;
  text?: string;
  name?: string;
  subtype?: string;
  total_cost_usd?: number;
  duration_ms?: number;
}

class KnowledgeAgent {
  private defaultOptions: QueryOptions;

  constructor() {
    this.defaultOptions = {
      maxTurns: 20,
      cwd: process.cwd(),
      model: "sonnet",  // Valid shorthand: "opus", "sonnet", or "haiku"
      allowedTools: [
        "Read",      // Read full files
        "Grep",      // Search within files
        "Glob"       // Find files by pattern
      ],
      appendSystemPrompt: SYSTEM_PROMPT,
      settingSources: ['local', 'project']
    };
  }

  async *queryStream(prompt: string): AsyncIterable<StreamMessage> {
    for await (const message of query({
      prompt,
      options: this.defaultOptions
    })) {
      yield message as StreamMessage;
    }
  }

  async ask(question: string): Promise<void> {
    console.log(`\nQuestion: ${question}\n`);
    console.log("Agent response:");
    console.log("─".repeat(60));

    for await (const message of this.queryStream(question)) {
      // Stream assistant text responses
      if (message.type === "text" && message.text) {
        process.stdout.write(message.text);
      }

      // Log tool usage for transparency
      if (message.type === "tool_use" && message.name) {
        console.log(`\n[Using tool: ${message.name}]`);
      }

      // Show final result statistics
      if (message.type === "result") {
        console.log("\n" + "─".repeat(60));
        const result = (message as any).result;
        if (result) {
          console.log(result);
          console.log("─".repeat(60));
        }
        if (message.total_cost_usd !== undefined) {
          console.log(`Cost: $${message.total_cost_usd.toFixed(4)}`);
        }
        if (message.duration_ms !== undefined) {
          console.log(`Duration: ${message.duration_ms}ms`);
        }
      }
    }
  }
}

// CLI interface
const agent = new KnowledgeAgent();

if (process.argv.length > 2) {
  // CLI mode: node agent.ts "Your question here"
  const question = process.argv.slice(2).join(' ');
  await agent.ask(question);
} else {
  // Interactive examples
  console.log("=".repeat(60));
  console.log("Knowledge Agent - Example Queries");
  console.log("=".repeat(60));

  // Example: Explicitly reference files for best results
  await agent.ask("Read knowledge/coffee-brewing-guide.md and tell me about pour-over brewing");
  await agent.ask("Search knowledge/understanding-websockets.md for information about the handshake process");
  await agent.ask("What does knowledge/space-exploration-history.md say about the Apollo 11 mission?");
}
