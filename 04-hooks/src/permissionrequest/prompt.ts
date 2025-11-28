/**
 * PermissionRequest hook test prompt
 * PermissionRequest fires when a tool requires user permission (like Bash)
 */
export const hookName = "PermissionRequest";
export const description = "PermissionRequest fires when tools require permission approval";
export const prompt = "Run the command 'ls -la' using the Bash tool to list files in the current directory.";
export const maxTurns = 3;
