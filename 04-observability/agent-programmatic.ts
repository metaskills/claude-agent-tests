import { query } from "@anthropic-ai/claude-agent-sdk";
import { logHook } from "./src/hook-logger.ts";
import { testScenarios } from "./src/test-scenarios.ts";

console.log("🧪 Claude Agent SDK - Programmatic Hooks Test\n");
console.log("This agent tests all 11 hooks using programmatic configuration\n");

// Track which hooks fired
const hooksFired = new Set<string>();

// Run automated test suite
async function runTests(): Promise<void> {
  console.log("Starting automated test suite...\n");

  for (const scenario of testScenarios) {
    console.log(`\n📋 Test: ${scenario.name}`);
    console.log(`💬 Prompt: ${scenario.prompt}\n`);

    try {
      const agentQuery = query({
        prompt: scenario.prompt,
        options: {
          cwd: process.cwd(),
          model: "sonnet",
          settingSources: [], // Don't load .claude/settings.json
          hooks: {
            SessionStart: [
              {
                hooks: [
                  async (input) => {
                    hooksFired.add("SessionStart");
                    await logHook("SessionStart", input);
                    return { continue: true };
                  },
                ],
              },
            ],
            UserPromptSubmit: [
              {
                hooks: [
                  async (input) => {
                    hooksFired.add("UserPromptSubmit");
                    await logHook("UserPromptSubmit", input);
                    return { continue: true };
                  },
                ],
              },
            ],
            PermissionRequest: [
              {
                hooks: [
                  async (input) => {
                    hooksFired.add("PermissionRequest");
                    await logHook("PermissionRequest", input);
                    return { continue: true };
                  },
                ],
              },
            ],
            PreToolUse: [
              {
                hooks: [
                  async (input) => {
                    hooksFired.add("PreToolUse");
                    await logHook("PreToolUse", input);
                    return { continue: true };
                  },
                ],
              },
            ],
            PostToolUse: [
              {
                hooks: [
                  async (input) => {
                    hooksFired.add("PostToolUse");
                    await logHook("PostToolUse", input);
                    return { continue: true };
                  },
                ],
              },
            ],
            Notification: [
              {
                hooks: [
                  async (input) => {
                    hooksFired.add("Notification");
                    await logHook("Notification", input);
                    return { continue: true };
                  },
                ],
              },
            ],
            SubagentStart: [
              {
                hooks: [
                  async (input) => {
                    hooksFired.add("SubagentStart");
                    await logHook("SubagentStart", input);
                    return { continue: true };
                  },
                ],
              },
            ],
            SubagentStop: [
              {
                hooks: [
                  async (input) => {
                    hooksFired.add("SubagentStop");
                    await logHook("SubagentStop", input);
                    return { continue: true };
                  },
                ],
              },
            ],
            PreCompact: [
              {
                hooks: [
                  async (input) => {
                    hooksFired.add("PreCompact");
                    await logHook("PreCompact", input);
                    return { continue: true };
                  },
                ],
              },
            ],
            Stop: [
              {
                hooks: [
                  async (input) => {
                    hooksFired.add("Stop");
                    await logHook("Stop", input);
                    return { continue: true };
                  },
                ],
              },
            ],
            SessionEnd: [
              {
                hooks: [
                  async (input) => {
                    hooksFired.add("SessionEnd");
                    await logHook("SessionEnd", input);
                    return { continue: true };
                  },
                ],
              },
            ],
          },
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

  // Generate summary report
  console.log("\n" + "=".repeat(60));
  console.log("📊 Test Summary");
  console.log("=".repeat(60));
  console.log(`\nHooks that fired (${hooksFired.size}/11):`);

  const allHooks = [
    "SessionStart",
    "UserPromptSubmit",
    "PermissionRequest",
    "PreToolUse",
    "PostToolUse",
    "Notification",
    "SubagentStart",
    "SubagentStop",
    "PreCompact",
    "Stop",
    "SessionEnd",
  ];

  for (const hook of allHooks) {
    const fired = hooksFired.has(hook);
    console.log(`  ${fired ? "✅" : "❌"} ${hook}`);
  }

  console.log(`\n📁 Check logs/ directory for detailed hook data\n`);
}

// Run the tests
runTests().catch((error) => {
  console.error("Fatal error:", error.message);
  process.exit(1);
});
