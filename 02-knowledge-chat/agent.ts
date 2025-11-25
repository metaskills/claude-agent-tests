import { query } from '@anthropic-ai/claude-agent-sdk';
import { input } from '@inquirer/prompts';
import { readFile, writeFile } from 'fs/promises';
import { readdirSync, existsSync } from 'fs';
import { join } from 'path';

// Session file for persistence
const SESSION_FILE = '.session';

// Auto-discover knowledge files
const knowledgeDir = 'knowledge';
const knowledgeFiles = readdirSync(knowledgeDir)
  .filter(f => f.endsWith('.md'))
  .map(f => join(knowledgeDir, f));

// System context for the agent
const SYSTEM_CONTEXT = `You are a knowledge assistant with access to:
${knowledgeFiles.map(f => `- ${f}`).join('\n')}

When answering questions:
1. Determine which file is relevant
2. Use the Read tool to access it
3. Answer with citations`;

// Load session ID from disk
async function loadSession(): Promise<string | undefined> {
  if (!existsSync(SESSION_FILE)) {
    return undefined;
  }
  try {
    const sessionId = await readFile(SESSION_FILE, 'utf-8');
    return sessionId.trim();
  } catch {
    return undefined;
  }
}

// Save session ID to disk
async function saveSession(sessionId: string): Promise<void> {
  await writeFile(SESSION_FILE, sessionId, 'utf-8');
}

// Process a single turn with the agent
async function processTurn(userMessage: string, sessionId?: string): Promise<string | undefined> {
  let newSessionId: string | undefined = sessionId;

  // Prepend system context on first turn only
  const prompt = sessionId
    ? userMessage
    : `${SYSTEM_CONTEXT}\n\nUser: ${userMessage}`;

  const agentQuery = query({
    prompt,
    options: {
      resume: sessionId,
      cwd: process.cwd(),
      allowedTools: ['Read'],
      model: 'sonnet'
    }
  });

  for await (const message of agentQuery) {
    // Save session ID when first received (note: it's session_id not sessionId)
    if (message.type === 'system' && message.session_id) {
      newSessionId = message.session_id;
      await saveSession(message.session_id);
    }

    // Handle assistant messages with text content
    if (message.type === 'assistant' && message.message?.content) {
      console.log('\nAssistant:');
      for (const content of message.message.content) {
        if (content.type === 'text' && content.text) {
          console.log(content.text);
        }
        // Show tool usage
        if (content.type === 'tool_use' && content.name === 'Read') {
          const fileName = content.input?.file_path?.split('/').pop() || 'file';
          console.log(`\n📖 Reading ${fileName}...`);
        }
      }
      console.log(); // Extra newline for spacing
    }

    // Show errors
    if (message.type === 'error') {
      console.error('\n❌ Error:', message.error);
    }
  }

  return newSessionId;
}

// Main REPL loop
async function runREPL(): Promise<void> {
  // Check for --resume flag
  const shouldResume = process.argv.includes('--resume');

  let sessionId: string | undefined;

  if (shouldResume) {
    sessionId = await loadSession();
    if (sessionId) {
      console.log('📝 Resuming previous session\n');
    } else {
      console.log('⚠️  No saved session found, starting new session\n');
    }
  } else {
    console.log('💬 Starting new chat session (type "exit" to quit)\n');
    console.log('💡 Use "npm start -- --resume" to continue previous session\n');
  }

  // REPL loop - one query() call per turn
  while (true) {
    const userMessage = await input({
      message: 'You:'
    });

    const trimmed = userMessage.trim();

    if (trimmed.toLowerCase() === 'exit' || trimmed.toLowerCase() === 'quit') {
      console.log('\n✅ Session ended\n');
      break;
    }

    if (trimmed) {
      try {
        sessionId = await processTurn(trimmed, sessionId);
      } catch (error) {
        console.error('\n❌ Agent error:', error);
        break;
      }
    }
  }
}

// Run the REPL
runREPL().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
