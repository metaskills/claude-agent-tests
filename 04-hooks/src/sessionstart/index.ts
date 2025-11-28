import { runProgrammatic } from "./programmatic.ts";
import { runDeclarative } from "./declarative.ts";
import { compareResults } from "../shared/compare.ts";
import { hookName, description } from "./prompt.ts";

console.log("=".repeat(60));
console.log(`Testing ${hookName} Hook`);
console.log("=".repeat(60));
console.log(`\nDescription: ${description}\n`);

try {
  const progLogPath = await runProgrammatic();
  const declLogPath = await runDeclarative();

  await compareResults(progLogPath, declLogPath);

  console.log("Test complete.");
} catch (error) {
  console.error("\nTest failed:", (error as Error).message);
  process.exit(1);
}
