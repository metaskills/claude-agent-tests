import { query } from "@anthropic-ai/claude-agent-sdk";
import { prompt, hookName } from "./prompt.ts";
import { env } from "../shared/env.ts";

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
        console.log(message.is_error ? "  Test failed with errors" : "  Test completed successfully");
      }
    }
  } finally {
    await env.cleanupDeclarativeSettings();
  }

  const logsAfter = await env.getLogFiles();
  const newLogs = env.findNewDeclarativeLogs(logsBefore, logsAfter);

  if (newLogs.length === 0) {
    throw new Error(`${hookName} hook did not fire (no declarative log found)`);
  }

  return env.getLogPath(newLogs[0]);
}
