/**
 * PreToolUse hook test prompt
 * This prompt triggers a file read which fires PreToolUse before the Read tool executes
 */
export const prompt = "Read the file Hooks.md and tell me what hook events are listed.";
export const description = "Triggers PreToolUse when Read tool is invoked";
export const hookName = "PreToolUse";
