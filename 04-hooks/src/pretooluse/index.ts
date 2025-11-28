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

// Run programmatic test
try {
  progLogPath = await runProgrammatic();
  console.log("  ✓ Programmatic test PASSED\n");
} catch (error) {
  progError = error as Error;
  console.log("  ✗ Programmatic test FAILED\n");
}

// Run declarative test (always, regardless of programmatic result)
try {
  declLogPath = await runDeclarative();
  console.log("  ✓ Declarative test PASSED\n");
} catch (error) {
  declError = error as Error;
  console.log("  ✗ Declarative test FAILED\n");
}

// Compare results if both succeeded
if (progLogPath && declLogPath) {
  await compareResults(progLogPath, declLogPath);
}

// Summary
console.log("=".repeat(60));
console.log("Summary:");
console.log(`  Programmatic: ${progLogPath ? "PASSED" : "FAILED"}`);
console.log(`  Declarative:  ${declLogPath ? "PASSED" : "FAILED"}`);

if (progError) {
  console.log(`\nProgrammatic error: ${progError.message}`);
}
if (declError) {
  console.log(`\nDeclarative error: ${declError.message}`);
}

// Exit with error if either failed
if (progError || declError) {
  process.exit(1);
}
