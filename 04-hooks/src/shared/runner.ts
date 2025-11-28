import { query } from "@anthropic-ai/claude-agent-sdk";
import { readFile } from "fs/promises";
import { env } from "./env.ts";
import { getValidator, printValidation } from "./validate.ts";
import { compareResults } from "./compare.ts";

interface HookConfig {
  hookName: string;
  description: string;
  prompt: string;
  maxTurns: number;
}

export async function runHookTest(config: HookConfig): Promise<void> {
  const { hookName, description, prompt, maxTurns } = config;

  // Clean logs at start
  await env.cleanLogs();

  console.log("=".repeat(60));
  console.log(`Testing ${hookName} Hook`);
  console.log("=".repeat(60));
  console.log(`\nDescription: ${description}\n`);

  let progLogPath: string | null = null;
  let declLogPath: string | null = null;
  let progError: Error | null = null;
  let declError: Error | null = null;

  // Programmatic test
  try {
    progLogPath = await runProgrammatic(hookName, prompt, maxTurns);
    console.log("  ✓ Programmatic test PASSED\n");
  } catch (error) {
    progError = error as Error;
    console.log("  ✗ Programmatic test FAILED\n");
  }

  // Declarative test
  try {
    declLogPath = await runDeclarative(hookName, prompt, maxTurns);
    console.log("  ✓ Declarative test PASSED\n");
  } catch (error) {
    declError = error as Error;
    console.log("  ✗ Declarative test FAILED\n");
  }

  // Compare if both succeeded
  if (progLogPath && declLogPath) {
    await compareResults(progLogPath, declLogPath);
  }

  // Summary and exit
  printSummary(progLogPath, declLogPath, progError, declError);
}

async function runProgrammatic(hookName: string, prompt: string, maxTurns: number): Promise<string> {
  console.log("\n--- Programmatic Test ---");

  let logFilePath: string | null = null;

  const agentQuery = query({
    prompt,
    options: {
      cwd: env.projectRoot,
      model: "haiku",
      maxTurns,
      settingSources: [],
      hooks: {
        [hookName]: [{
          hooks: [async (input) => {
            logFilePath = await env.logHook(hookName, input, "programmatic");
            return { continue: true };
          }]
        }]
      }
    }
  });

  for await (const message of agentQuery) {
    if (message.type === "result") {
      console.log(message.is_error ? "  Query failed with errors" : "  Query completed");
    }
  }

  if (!logFilePath) {
    throw new Error(`${hookName} hook did not fire`);
  }

  console.log(`  Hook fired - logged to logs/${hookName}_programmatic.json`);

  // Validate
  const logData = JSON.parse(await readFile(logFilePath, "utf-8"));
  const validation = getValidator(hookName)(logData);
  printValidation(validation, `${hookName}HookInput`);

  if (!validation.valid) {
    throw new Error("Hook input failed type validation");
  }

  return logFilePath;
}

async function runDeclarative(hookName: string, prompt: string, maxTurns: number): Promise<string> {
  console.log("\n--- Declarative Test ---");

  await env.setupDeclarativeSettings(hookName);

  try {
    const agentQuery = query({
      prompt,
      options: {
        cwd: env.projectRoot,
        model: "haiku",
        maxTurns,
        settingSources: ["project"]
      }
    });

    for await (const message of agentQuery) {
      if (message.type === "result") {
        console.log(message.is_error ? "  Query failed with errors" : "  Query completed");
      }
    }
  } finally {
    await env.cleanupDeclarativeSettings();
  }

  const logFilePath = env.getExpectedLogPath(hookName, "declarative");

  // Check if file exists (hook fired)
  try {
    await readFile(logFilePath, "utf-8");
  } catch {
    throw new Error(`${hookName} hook did not fire (no declarative log found)`);
  }

  console.log(`  Hook fired - logged to logs/${hookName}_declarative.json`);

  // Validate
  const logData = JSON.parse(await readFile(logFilePath, "utf-8"));
  const validation = getValidator(hookName)(logData);
  printValidation(validation, `${hookName}HookInput`);

  if (!validation.valid) {
    throw new Error("Hook input failed type validation");
  }

  return logFilePath;
}

function printSummary(progPath: string | null, declPath: string | null, progErr: Error | null, declErr: Error | null): void {
  console.log("=".repeat(60));
  console.log("Summary:");
  console.log(`  Programmatic: ${progPath ? "PASSED" : "FAILED"}`);
  console.log(`  Declarative:  ${declPath ? "PASSED" : "FAILED"}`);

  if (progErr) console.log(`\nProgrammatic error: ${progErr.message}`);
  if (declErr) console.log(`\nDeclarative error: ${declErr.message}`);

  if (progErr || declErr) process.exit(1);
}
