import { query } from "@anthropic-ai/claude-agent-sdk";
import { prompt, hookName } from "./prompt.ts";
import { env } from "../shared/env.ts";

let logFilePath: string | null = null;

export async function runProgrammatic(): Promise<string> {
  console.log("\n--- Programmatic Test ---");

  const agentQuery = query({
    prompt,
    options: {
      cwd: env.projectRoot,
      model: "haiku",
      maxTurns: 1,
      settingSources: [],
      hooks: {
        SessionEnd: [
          {
            hooks: [
              async (input) => {
                logFilePath = await env.logHook(hookName, input, "programmatic");
                return { continue: true };
              },
            ],
          },
        ],
      },
    },
  });

  for await (const message of agentQuery) {
    if (message.type === "result") {
      if (message.is_error) {
        console.log("  Test failed with errors");
      } else {
        console.log("  Test completed successfully");
      }
    }
  }

  if (!logFilePath) {
    throw new Error("SessionEnd hook did not fire");
  }

  return logFilePath;
}
