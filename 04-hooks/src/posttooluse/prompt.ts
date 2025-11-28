/**
 * PostToolUse hook test prompt
 * This prompt triggers a file read which fires PostToolUse after the Read tool executes
 */
export const hookName = "PostToolUse";
export const description = "Triggers PostToolUse after Read tool completes";
export const prompt = "Read the file Hooks.md and tell me what hook events are listed.";
export const maxTurns = 3;
