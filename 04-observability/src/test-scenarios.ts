/**
 * Test scenarios designed to trigger different hooks
 */
export interface TestScenario {
  name: string;
  prompt: string;
  expectedHooks: string[];
}

export const testScenarios: TestScenario[] = [
  {
    name: "Basic file read",
    prompt: "Read the Hooks.md file and tell me what it contains",
    expectedHooks: ["UserPromptSubmit", "PreToolUse", "PostToolUse"],
  },
  {
    name: "List directory",
    prompt: "List all files in the current directory using the Bash tool",
    expectedHooks: ["UserPromptSubmit", "PermissionRequest", "PreToolUse", "PostToolUse"],
  },
  {
    name: "Simple question",
    prompt: "What is the Claude Agent SDK?",
    expectedHooks: ["UserPromptSubmit"],
  },
];

/**
 * Expected hooks that should fire during test execution:
 *
 * - SessionStart: Fires once at the beginning
 * - UserPromptSubmit: Fires for each test scenario prompt
 * - PermissionRequest: May fire for Bash/Write tools
 * - PreToolUse: Fires before each tool execution
 * - PostToolUse: Fires after each tool execution
 * - Notification: May fire for SDK notifications
 * - SubagentStart: Would fire if we launch a subagent (not in current tests)
 * - SubagentStop: Would fire when subagent completes (not in current tests)
 * - PreCompact: Would fire before compacting (not expected in short test)
 * - Stop: Would fire on interrupt (not in automated test)
 * - SessionEnd: Fires once at the end
 */
