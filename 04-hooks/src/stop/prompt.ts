/**
 * Stop hook test prompt
 * Stop fires when the agent is interrupted (SIGINT/Ctrl+C)
 * Note: This hook requires manual interruption and cannot be tested automatically
 */
export const prompt = "What is 2 + 2?";
export const description = "Stop fires on interruption (requires manual SIGINT - cannot be tested automatically)";
export const hookName = "Stop";
