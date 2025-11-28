import { readFile } from "fs/promises";
import type { HookLogData, ComparisonResult } from "./types.ts";

/**
 * Compare programmatic and declarative hook outputs side-by-side
 */
export async function compareResults(
  progLogPath: string,
  declLogPath: string
): Promise<void> {
  const progData: HookLogData = JSON.parse(
    await readFile(progLogPath, "utf-8")
  );
  const declData: HookLogData = JSON.parse(
    await readFile(declLogPath, "utf-8")
  );

  console.log("\n" + "=".repeat(60));
  console.log("Comparison Results");
  console.log("=".repeat(60));

  // Fields to compare (excluding approach and logged_at which will differ)
  const fieldsToCompare = [
    "session_id",
    "transcript_path",
    "cwd",
    "permission_mode",
    "hook_event_name",
    "tool_name",
    "tool_input",
    "tool_response",
    "tool_use_id",
    "prompt",
    "source",
    "message",
    "title",
    "notification_type",
    "agent_id",
    "agent_type",
    "agent_transcript_path",
    "stop_hook_active",
    "trigger",
    "custom_instructions",
    "reason",
  ];

  const results: ComparisonResult[] = [];

  for (const field of fieldsToCompare) {
    const progValue = (progData as Record<string, unknown>)[field];
    const declValue = (declData as Record<string, unknown>)[field];

    // Skip fields that don't exist in either
    if (progValue === undefined && declValue === undefined) {
      continue;
    }

    const match = JSON.stringify(progValue) === JSON.stringify(declValue);
    results.push({
      field,
      programmatic: progValue,
      declarative: declValue,
      match,
    });
  }

  // Print results
  let matchCount = 0;
  let diffCount = 0;

  for (const result of results) {
    if (result.match) {
      matchCount++;
      console.log(`  ${result.field}: ${formatValue(result.programmatic)}`);
    } else {
      diffCount++;
      console.log(`  ${result.field}: DIFFERS`);
      console.log(`    programmatic: ${formatValue(result.programmatic)}`);
      console.log(`    declarative:  ${formatValue(result.declarative)}`);
    }
  }

  console.log("\n" + "-".repeat(60));
  console.log(`Summary: ${matchCount} matching, ${diffCount} different`);
  console.log("-".repeat(60) + "\n");
}

function formatValue(value: unknown): string {
  if (value === undefined) return "(undefined)";
  if (value === null) return "(null)";
  if (typeof value === "string") {
    // Truncate long strings
    if (value.length > 50) {
      return `"${value.substring(0, 47)}..."`;
    }
    return `"${value}"`;
  }
  if (typeof value === "object") {
    const str = JSON.stringify(value);
    if (str.length > 50) {
      return str.substring(0, 47) + "...";
    }
    return str;
  }
  return String(value);
}
