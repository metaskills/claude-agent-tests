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
# Install dependencies
npm install

# Ask questions
node agent.ts "Who discovered coffee?"
node agent.ts "What makes the V60 special?"
node agent.ts "What did astronauts find on Mars?"

# Run demo mode
node agent.ts
```
