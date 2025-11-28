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
      maxTurns: 3,
      settingSources: [],
      hooks: {
        PermissionRequest: [
          {
            hooks: [
              async (input) => {
                logFilePath = await env.logHook(hookName, input, "programmatic");
                // Auto-approve the permission request
                return { continue: true, decision: "approve" };
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
    throw new Error("PermissionRequest hook did not fire");
  }

  return logFilePath;
}
