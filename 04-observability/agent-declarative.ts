import { query } from "@anthropic-ai/claude-agent-sdk";
import { testScenarios } from "./src/test-scenarios.ts";

console.log("🧪 Claude Agent SDK - Declarative Hooks Test\n");
console.log("This agent tests all 11 hooks using declarative configuration (.claude/settings.json)\n");

// Run automated test suite
async function runTests(): Promise<void> {
  console.log("Starting automated test suite...\n");
  console.log("Note: Hooks are configured in .claude/settings.json\n");
  console.log("Shell scripts in scripts/ directory will log hook data\n");

  for (const scenario of testScenarios) {
    console.log(`\n📋 Test: ${scenario.name}`);
    console.log(`💬 Prompt: ${scenario.prompt}\n`);

    try {
      const agentQuery = query({
        prompt: scenario.prompt,
        options: {
          cwd: process.cwd(),
          model: "sonnet",
          settingSources: ["project"], // Load .claude/settings.json
        },
      });

      // Process agent response
      for await (const message of agentQuery) {
        if (message.type === "assistant" && message.message?.content) {
          for (const content of message.message.content) {
            if (content.type === "text") {
              console.log(`\n🤖 ${content.text}\n`);
            }
          }
        }

        if (message.type === "result") {
          if (message.is_error) {
            console.log(`\n❌ Test failed with errors`);
          } else {
            console.log(`\n✅ Test completed successfully`);
          }
        }
      }
    } catch (error) {
      console.error(`\n❌ Test error:`, error);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("📊 Test Summary");
  console.log("=".repeat(60));
  console.log("\n📁 Check logs/ directory for detailed hook data");
  console.log("🔍 Each shell script in scripts/ logs to a separate JSON file\n");
}

// Run the tests
runTests().catch((error) => {
  console.error("Fatal error:", error.message);
  process.exit(1);
});
