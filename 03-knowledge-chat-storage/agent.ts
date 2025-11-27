import { query } from "@anthropic-ai/claude-agent-sdk";
import { input } from "@inquirer/prompts";
import { readdirSync } from "fs";
import { join } from "path";
import { session } from "./src/session.ts";

// Auto-discover knowledge files
const knowledgeDir = "knowledge";
const knowledgeFiles = readdirSync(knowledgeDir)
  .filter((f) => f.endsWith(".md"))
  .map((f) => join(knowledgeDir, f));

// System context for the agent
const SYSTEM_CONTEXT = `You are a knowledge assistant with access to:
${knowledgeFiles.map((f) => `- ${f}`).join("\n")}

When answering questions:
1. Determine which file is relevant
2. Use the Read tool to access it
3. Answer with citations`;

// Process a single turn with the agent
async function processTurn(
  userMessage: string,
  sessionId?: string
): Promise<void> {
  // Prepend system context on first turn only
  const prompt = sessionId
    ? userMessage
    : `${SYSTEM_CONTEXT}\n\nUser: ${userMessage}`;

  const agentQuery = query({
    prompt,
    options: {
      resume: sessionId,
      cwd: process.cwd(),
      allowedTools: ["Read"],
      model: "sonnet",
      settingSources: ["project"],
    },
  });

  for await (const message of agentQuery) {
    // Handle assistant messages with text content
    if (message.type === "assistant" && message.message?.content) {
      console.log("\nAssistant:");
      for (const content of message.message.content) {
        if (content.type === "text" && content.text) {
          console.log(content.text);
        }
        // Show tool usage
        if (content.type === "tool_use" && content.name === "Read") {
          const fileName = content.input?.file_path?.split("/").pop() || "file";
          console.log(`\n📖 Reading ${fileName}...`);
        }
      }
      console.log(); // Extra newline for spacing
    }

    // Show errors
    if (message.type === "error") {
      console.error("\n❌ Error:", message.error);
    }
  }
}

// Main REPL loop
async function runREPL(): Promise<void> {
  // Check for --resume flag
  const shouldResume = process.argv.includes("--resume");

  if (shouldResume) {
    if (session.getId()) {
      console.log("📝 Resuming previous session\n");
    } else {
      console.log("⚠️  No saved session found, starting new session\n");
    }
  } else {
    console.log('💬 Starting new chat session (type "exit" to quit)\n');
    console.log('💡 Use "npm run resume" to continue previous session\n');
  }

  // REPL loop - one query() call per turn
  while (true) {
    const userMessage = await input({
      message: "You:",
    });

    const trimmed = userMessage.trim();

    if (trimmed.toLowerCase() === "exit" || trimmed.toLowerCase() === "quit") {
      console.log("\n✅ Session ended\n");
      break;
    }

    if (trimmed) {
      try {
        await processTurn(trimmed, session.getId());
        session.reload(); // Hook writes, we read
      } catch (error) {
        console.error("\n❌ Agent error:", error);
        break;
      }
    }
  }
}

// Run the REPL
runREPL().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
