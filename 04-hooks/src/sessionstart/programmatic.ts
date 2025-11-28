import { query } from "@anthropic-ai/claude-agent-sdk";
import { readFile } from "fs/promises";
import { prompt, hookName } from "./prompt.ts";
import { env } from "../shared/env.ts";
import { validateSessionStart, printValidation } from "../shared/validate.ts";

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
        SessionStart: [
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
        console.log("  Query failed with errors");
      } else {
        console.log("  Query completed");
      }
    }
  }

  // Verify hook actually fired
  if (!logFilePath) {
    console.log("  Hook did NOT fire - no log generated");
    throw new Error("SessionStart hook did not fire (programmatic hooks may not be supported for lifecycle events)");
  }

  console.log(`  Hook fired - logged to logs/${logFilePath.split("/").pop()}`);

  // Validate against SessionStartHookInput type
  const logData = JSON.parse(await readFile(logFilePath, "utf-8"));
  const validation = validateSessionStart(logData);
  printValidation(validation, "SessionStartHookInput");

  if (!validation.valid) {
    throw new Error("Hook input failed type validation");
  }

  return logFilePath;
}
