import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { readdir, copyFile, unlink, writeFile, mkdir } from "fs/promises";
import type { HookInput } from "@anthropic-ai/claude-agent-sdk";

export type Approach = "programmatic" | "declarative";

const __dirname = dirname(fileURLToPath(import.meta.url));

class Env {
  get projectRoot(): string {
    return dirname(dirname(__dirname));
  }

  get logsDir(): string {
    return join(this.projectRoot, "logs");
  }

  get claudeDir(): string {
    return join(this.projectRoot, ".claude");
  }

  get settingsPath(): string {
    return join(this.claudeDir, "settings.json");
  }

  async getLogFiles(): Promise<string[]> {
    try {
      const files = await readdir(this.logsDir);
      return files.filter((f) => f.endsWith(".json"));
    } catch {
      return [];
    }
  }

  async setupDeclarativeSettings(hookName: string): Promise<void> {
    const settingsSource = join(this.claudeDir, `settings-${hookName.toLowerCase()}.json`);
    await copyFile(settingsSource, this.settingsPath);
  }

  async cleanupDeclarativeSettings(): Promise<void> {
    await unlink(this.settingsPath).catch(() => {});
  }

  findNewDeclarativeLogs(logsBefore: string[], logsAfter: string[]): string[] {
    return logsAfter.filter(
      (log) => !logsBefore.includes(log) && log.includes("declarative")
    );
  }

  findNewProgrammaticLogs(logsBefore: string[], logsAfter: string[]): string[] {
    return logsAfter.filter(
      (log) => !logsBefore.includes(log) && log.includes("programmatic")
    );
  }

  getLogPath(filename: string): string {
    return join(this.logsDir, filename);
  }

  async logHook(hookName: string, input: HookInput, approach: Approach): Promise<string> {
    await mkdir(this.logsDir, { recursive: true });

    const timestamp = new Date()
      .toISOString()
      .replace(/:/g, "-")
      .replace(/\..+/, "");

    // Log pure hook input only - no test-specific additions
    const filename = `${hookName}_${approach}_${timestamp}.json`;
    const filepath = join(this.logsDir, filename);
    await writeFile(filepath, JSON.stringify(input, null, 2), "utf-8");

    return filepath;
  }
}

export const env = new Env();
