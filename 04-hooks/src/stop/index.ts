import { runProgrammatic } from "./programmatic.ts";
import { runDeclarative } from "./declarative.ts";
import { compareResults } from "../shared/compare.ts";
import { hookName, description } from "./prompt.ts";

console.log("=".repeat(60));
console.log(`Testing ${hookName} Hook`);
console.log("=".repeat(60));
console.log(`\nDescription: ${description}\n`);

let progLogPath: string | null = null;
let declLogPath: string | null = null;
let progError: Error | null = null;
let declError: Error | null = null;

try {
  progLogPath = await runProgrammatic();
  console.log("  ✓ Programmatic test PASSED\n");
} catch (error) {
  progError = error as Error;
  console.log("  ✗ Programmatic test FAILED\n");
}

try {
  declLogPath = await runDeclarative();
  console.log("  ✓ Declarative test PASSED\n");
} catch (error) {
  declError = error as Error;
  console.log("  ✗ Declarative test FAILED\n");
}

if (progLogPath && declLogPath) {
  await compareResults(progLogPath, declLogPath);
}

console.log("=".repeat(60));
console.log("Summary:");
console.log(`  Programmatic: ${progLogPath ? "PASSED" : "FAILED"}`);
console.log(`  Declarative:  ${declLogPath ? "PASSED" : "FAILED"}`);

if (progError) console.log(`\nProgrammatic error: ${progError.message}`);
if (declError) console.log(`\nDeclarative error: ${declError.message}`);

if (progError || declError) process.exit(1);
