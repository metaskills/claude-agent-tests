import type { HookInput } from "@anthropic-ai/claude-agent-sdk";
import type { Approach } from "./env.ts";

export type { Approach };

export interface HookLogData extends HookInput {
  logged_at: string;
  approach: Approach;
}

export interface ComparisonResult {
  field: string;
  programmatic: unknown;
  declarative: unknown;
  match: boolean;
}
