import { query } from "@anthropic-ai/claude-agent-sdk";
import { readFile } from "fs/promises";
import { prompt, hookName } from "./prompt.ts";
import { env } from "../shared/env.ts";
import { validateSubagentStart, printValidation } from "../shared/validate.ts";

export async function runDeclarative(): Promise<string> {
  console.log("\n--- Declarative Test ---");

  await env.setupDeclarativeSettings(hookName);
  const logsBefore = await env.getLogFiles();

  try {
    const agentQuery = query({
      prompt,
      options: {
        cwd: env.projectRoot,
        model: "haiku",
        maxTurns: 5,
        settingSources: ["project"],
      },
    });

    for await (const message of agentQuery) {
      if (message.type === "result") {
        console.log(message.is_error ? "  Query failed with errors" : "  Query completed");
      }
    }
  } finally {
    await env.cleanupDeclarativeSettings();
  }

  const logsAfter = await env.getLogFiles();
  const newLogs = env.findNewDeclarativeLogs(logsBefore, logsAfter);

  if (newLogs.length === 0) {
    console.log("  Hook did NOT fire - no log generated");
    throw new Error(`${hookName} hook did not fire (no declarative log found)`);
  }

  const logFilePath = env.getLogPath(newLogs[0]);
  console.log(`  Hook fired - logged to logs/${newLogs[0]}`);

  const logData = JSON.parse(await readFile(logFilePath, "utf-8"));
  const validation = validateSubagentStart(logData);
  printValidation(validation, "SubagentStartHookInput");

  if (!validation.valid) throw new Error("Hook input failed type validation");

  return logFilePath;
}
