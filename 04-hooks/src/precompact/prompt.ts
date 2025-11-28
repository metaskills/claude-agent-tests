/**
 * PreCompact hook test prompt
 * PreCompact fires before conversation compaction (requires long context)
 * Note: This hook is difficult to trigger in short automated tests
 */
export const prompt = "What is 2 + 2?";
export const description = "PreCompact fires before context compaction (hard to trigger in short tests)";
export const hookName = "PreCompact";
