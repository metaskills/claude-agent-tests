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

  if (progLogPath && declLogPath) {
    await compareResults(progLogPath, declLogPath);
  } else {
    console.log("\n" + "-".repeat(60));
    console.log("Comparison skipped - Notification hook did not fire");
    console.log("This is expected behavior for this hook type");
    console.log("-".repeat(60));
  }

  console.log("\nTest complete.");
} catch (error) {
  console.error("\nTest failed:", (error as Error).message);
  process.exit(1);
}
