import { query } from '@anthropic-ai/claude-agent-sdk';
import { readdirSync } from 'fs';
import { join } from 'path';

// Auto-discover knowledge files
const knowledgeDir = 'knowledge';
const knowledgeFiles = readdirSync(knowledgeDir)
  .filter(f => f.endsWith('.md'))
  .map(f => join(knowledgeDir, f));

// Get question from CLI args or use default
const userQuestion = process.argv.slice(2).join(' ') || 'How do WebSockets work?';

for await (const message of query({
  prompt: `You are a knowledge assistant with access to:
${knowledgeFiles.map(f => `- ${f}`).join('\n')}

When answering questions:
1. Determine which file is relevant
2. Use the Read tool to access it
3. Answer with citations

User: ${userQuestion}`,
  options: {
    cwd: process.cwd(),
    allowedTools: ['Read'],
    model: 'sonnet'
  }
})) {
  // Handle assistant messages with text content
  if (message.type === 'assistant' && message.message?.content) {
    for (const content of message.message.content) {
      if (content.type === 'text' && content.text) {
        process.stdout.write(content.text);
        console.log('\n');
      }
      // Show tool usage
      if (content.type === 'tool_use' && content.name === 'Read') {
        const fileName = content.input?.file_path?.split('/').pop() || 'file';
        console.log(`📖 Reading ${fileName}...\n`);
      }
    }
  }

  // Show result completion
  if (message.type === 'result') {
    console.log('✅ Complete\n');
  }
}
