/**
 * Type validation for hook inputs
 * Validates against SDK types from @anthropic-ai/claude-agent-sdk
 */

interface FieldValidation {
  field: string;
  expected: string;
  actual: string;
  valid: boolean;
  optional: boolean;
}

interface ValidationResult {
  valid: boolean;
  fields: FieldValidation[];
}

type FieldSpec = {
  name: string;
  expected: string;
  optional?: boolean;
  validate: (value: unknown) => boolean;
};

function validateField(data: Record<string, unknown>, spec: FieldSpec): FieldValidation {
  const value = data[spec.name];
  const isValid = spec.validate(value);
  const actualType = formatValue(value);

  return {
    field: spec.name,
    expected: spec.expected,
    actual: actualType,
    valid: isValid,
    optional: spec.optional ?? false,
  };
}

function formatValue(value: unknown): string {
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  if (typeof value === "string") return `"${truncate(value, 30)}"`;
  if (typeof value === "boolean") return String(value);
  if (typeof value === "object") return "[object]";
  return String(value);
}

function truncate(str: string, len: number): string {
  return str.length > len ? str.slice(0, len) + "..." : str;
}

// Base fields shared by all hooks
const baseFields: FieldSpec[] = [
  { name: "session_id", expected: "string", validate: (v) => typeof v === "string" },
  { name: "transcript_path", expected: "string", validate: (v) => typeof v === "string" },
  { name: "cwd", expected: "string", validate: (v) => typeof v === "string" },
  { name: "permission_mode", expected: "string | undefined", optional: true, validate: (v) => v === undefined || typeof v === "string" },
];

// SessionStart
export function validateSessionStart(input: unknown): ValidationResult {
  const data = input as Record<string, unknown>;
  const fields = [
    ...baseFields.map((spec) => validateField(data, spec)),
    validateField(data, { name: "hook_event_name", expected: "'SessionStart'", validate: (v) => v === "SessionStart" }),
    validateField(data, { name: "source", expected: "'startup' | 'resume' | 'clear' | 'compact'", validate: (v) => ["startup", "resume", "clear", "compact"].includes(v as string) }),
  ];
  return { valid: fields.filter((f) => !f.optional).every((f) => f.valid), fields };
}

// SessionEnd
export function validateSessionEnd(input: unknown): ValidationResult {
  const data = input as Record<string, unknown>;
  const fields = [
    ...baseFields.map((spec) => validateField(data, spec)),
    validateField(data, { name: "hook_event_name", expected: "'SessionEnd'", validate: (v) => v === "SessionEnd" }),
    validateField(data, { name: "reason", expected: "ExitReason (string)", validate: (v) => typeof v === "string" }),
  ];
  return { valid: fields.filter((f) => !f.optional).every((f) => f.valid), fields };
}

// PreToolUse
export function validatePreToolUse(input: unknown): ValidationResult {
  const data = input as Record<string, unknown>;
  const fields = [
    ...baseFields.map((spec) => validateField(data, spec)),
    validateField(data, { name: "hook_event_name", expected: "'PreToolUse'", validate: (v) => v === "PreToolUse" }),
    validateField(data, { name: "tool_name", expected: "string", validate: (v) => typeof v === "string" }),
    validateField(data, { name: "tool_input", expected: "unknown", validate: () => true }), // Any value is valid
    validateField(data, { name: "tool_use_id", expected: "string", validate: (v) => typeof v === "string" }),
  ];
  return { valid: fields.filter((f) => !f.optional).every((f) => f.valid), fields };
}

// PostToolUse
export function validatePostToolUse(input: unknown): ValidationResult {
  const data = input as Record<string, unknown>;
  const fields = [
    ...baseFields.map((spec) => validateField(data, spec)),
    validateField(data, { name: "hook_event_name", expected: "'PostToolUse'", validate: (v) => v === "PostToolUse" }),
    validateField(data, { name: "tool_name", expected: "string", validate: (v) => typeof v === "string" }),
    validateField(data, { name: "tool_input", expected: "unknown", validate: () => true }),
    validateField(data, { name: "tool_response", expected: "unknown", validate: () => true }),
    validateField(data, { name: "tool_use_id", expected: "string", validate: (v) => typeof v === "string" }),
  ];
  return { valid: fields.filter((f) => !f.optional).every((f) => f.valid), fields };
}

// PermissionRequest
export function validatePermissionRequest(input: unknown): ValidationResult {
  const data = input as Record<string, unknown>;
  const fields = [
    ...baseFields.map((spec) => validateField(data, spec)),
    validateField(data, { name: "hook_event_name", expected: "'PermissionRequest'", validate: (v) => v === "PermissionRequest" }),
    validateField(data, { name: "tool_name", expected: "string", validate: (v) => typeof v === "string" }),
    validateField(data, { name: "tool_input", expected: "unknown", validate: () => true }),
    validateField(data, { name: "permission_suggestions", expected: "PermissionUpdate[] | undefined", optional: true, validate: () => true }),
  ];
  return { valid: fields.filter((f) => !f.optional).every((f) => f.valid), fields };
}

// Notification
export function validateNotification(input: unknown): ValidationResult {
  const data = input as Record<string, unknown>;
  const fields = [
    ...baseFields.map((spec) => validateField(data, spec)),
    validateField(data, { name: "hook_event_name", expected: "'Notification'", validate: (v) => v === "Notification" }),
    validateField(data, { name: "message", expected: "string", validate: (v) => typeof v === "string" }),
    validateField(data, { name: "title", expected: "string | undefined", optional: true, validate: (v) => v === undefined || typeof v === "string" }),
    validateField(data, { name: "notification_type", expected: "string", validate: (v) => typeof v === "string" }),
  ];
  return { valid: fields.filter((f) => !f.optional).every((f) => f.valid), fields };
}

// UserPromptSubmit
export function validateUserPromptSubmit(input: unknown): ValidationResult {
  const data = input as Record<string, unknown>;
  const fields = [
    ...baseFields.map((spec) => validateField(data, spec)),
    validateField(data, { name: "hook_event_name", expected: "'UserPromptSubmit'", validate: (v) => v === "UserPromptSubmit" }),
    validateField(data, { name: "prompt", expected: "string", validate: (v) => typeof v === "string" }),
  ];
  return { valid: fields.filter((f) => !f.optional).every((f) => f.valid), fields };
}

// Stop
export function validateStop(input: unknown): ValidationResult {
  const data = input as Record<string, unknown>;
  const fields = [
    ...baseFields.map((spec) => validateField(data, spec)),
    validateField(data, { name: "hook_event_name", expected: "'Stop'", validate: (v) => v === "Stop" }),
    validateField(data, { name: "stop_hook_active", expected: "boolean", validate: (v) => typeof v === "boolean" }),
  ];
  return { valid: fields.filter((f) => !f.optional).every((f) => f.valid), fields };
}

// SubagentStart
export function validateSubagentStart(input: unknown): ValidationResult {
  const data = input as Record<string, unknown>;
  const fields = [
    ...baseFields.map((spec) => validateField(data, spec)),
    validateField(data, { name: "hook_event_name", expected: "'SubagentStart'", validate: (v) => v === "SubagentStart" }),
    validateField(data, { name: "agent_id", expected: "string", validate: (v) => typeof v === "string" }),
    validateField(data, { name: "agent_type", expected: "string", validate: (v) => typeof v === "string" }),
  ];
  return { valid: fields.filter((f) => !f.optional).every((f) => f.valid), fields };
}

// SubagentStop
export function validateSubagentStop(input: unknown): ValidationResult {
  const data = input as Record<string, unknown>;
  const fields = [
    ...baseFields.map((spec) => validateField(data, spec)),
    validateField(data, { name: "hook_event_name", expected: "'SubagentStop'", validate: (v) => v === "SubagentStop" }),
    validateField(data, { name: "stop_hook_active", expected: "boolean", validate: (v) => typeof v === "boolean" }),
    validateField(data, { name: "agent_id", expected: "string", validate: (v) => typeof v === "string" }),
    validateField(data, { name: "agent_transcript_path", expected: "string", validate: (v) => typeof v === "string" }),
  ];
  return { valid: fields.filter((f) => !f.optional).every((f) => f.valid), fields };
}

// PreCompact
export function validatePreCompact(input: unknown): ValidationResult {
  const data = input as Record<string, unknown>;
  const fields = [
    ...baseFields.map((spec) => validateField(data, spec)),
    validateField(data, { name: "hook_event_name", expected: "'PreCompact'", validate: (v) => v === "PreCompact" }),
    validateField(data, { name: "trigger", expected: "'manual' | 'auto'", validate: (v) => v === "manual" || v === "auto" }),
    validateField(data, { name: "custom_instructions", expected: "string | null", validate: (v) => v === null || typeof v === "string" }),
  ];
  return { valid: fields.filter((f) => !f.optional).every((f) => f.valid), fields };
}

// Lookup validator by hook name
export function getValidator(hookName: string): (input: unknown) => ValidationResult {
  const validators: Record<string, (input: unknown) => ValidationResult> = {
    SessionStart: validateSessionStart,
    SessionEnd: validateSessionEnd,
    PreToolUse: validatePreToolUse,
    PostToolUse: validatePostToolUse,
    PermissionRequest: validatePermissionRequest,
    Notification: validateNotification,
    UserPromptSubmit: validateUserPromptSubmit,
    Stop: validateStop,
    SubagentStart: validateSubagentStart,
    SubagentStop: validateSubagentStop,
    PreCompact: validatePreCompact,
  };
  return validators[hookName] ?? (() => ({ valid: false, fields: [] }));
}

export function printValidation(result: ValidationResult, typeName: string): void {
  console.log(`\n  Type Validation (${typeName}):`);
  for (const field of result.fields) {
    const icon = field.valid ? "✓" : "✗";
    const suffix = field.optional ? " (optional)" : "";
    console.log(`    ${icon} ${field.field}: ${field.expected} = ${field.actual}${suffix}`);
  }
}
