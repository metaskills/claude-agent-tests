import { writeFile } from "fs/promises";
import { existsSync, mkdirSync } from "fs";
import type { HookInput } from "@anthropic-ai/claude-agent-sdk";

/**
 * Logs hook data to JSON files in the logs/ directory
 */
export async function logHook(
  hookName: string,
  input: HookInput
): Promise<void> {
  // Ensure logs directory exists
  if (!existsSync("logs")) {
    mkdirSync("logs", { recursive: true });
  }

  // Create timestamp for unique filename
  const timestamp = new Date()
    .toISOString()
    .replace(/:/g, "-")
    .replace(/\..+/, "");

  // Add timestamp to the log data
  const logData = {
    ...input,
    logged_at: new Date().toISOString(),
  };

  // Write to JSON file
  const filename = `logs/${hookName}_${timestamp}.json`;
  await writeFile(filename, JSON.stringify(logData, null, 2), "utf-8");

  // Console log for visibility
  console.log(`🪝 ${hookName} logged to ${filename}`);
}
