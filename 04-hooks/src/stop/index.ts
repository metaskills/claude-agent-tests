import { runHookTest } from "../shared/runner.ts";
import { hookName, description, prompt, maxTurns } from "./prompt.ts";

await runHookTest({ hookName, description, prompt, maxTurns });
