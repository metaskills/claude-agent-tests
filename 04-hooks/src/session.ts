import { writeFile } from "fs/promises";
import { existsSync, readFileSync } from "fs";

/**
 * Singleton class for managing session persistence
 */
class Session {
  private readonly SESSION_FILE = ".session";
  private sessionId?: string;

  constructor() {
    // Load session from disk if it exists
    if (existsSync(this.SESSION_FILE)) {
      try {
        const id = readFileSync(this.SESSION_FILE, "utf-8");
        this.sessionId = id.trim();
      } catch {
        // Ignore read errors, start fresh
      }
    }
  }

  /**
   * Reload session ID from disk
   */
  reload(): void {
    if (existsSync(this.SESSION_FILE)) {
      try {
        const id = readFileSync(this.SESSION_FILE, "utf-8");
        this.sessionId = id.trim();
      } catch {
        // Ignore read errors
      }
    }
  }

  /**
   * Save session ID to disk
   */
  async save(id: string): Promise<void> {
    await writeFile(this.SESSION_FILE, id, "utf-8");
    this.sessionId = id;
  }

  /**
   * Get current session ID
   */
  getId(): string | undefined {
    return this.sessionId;
  }

  /**
   * Set session ID (without saving to disk)
   */
  setId(id: string | undefined): void {
    this.sessionId = id;
  }
}

// Export singleton instance
export const session = new Session();
