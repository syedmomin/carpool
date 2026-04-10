import fs from 'fs';
import path from 'path';
import { Request } from 'express';

const LOG_FILE = path.join(process.cwd(), 'error.log');

/**
 * Simple file-based error logger using Node.js native fs module.
 * Appends timestamped error entries to `error.log` in the project root.
 */
class Logger {
  /**
   * Log an error to the error.log file
   */
  logError(err: Error, req?: Request): void {
    const timestamp = new Date().toISOString();
    const method = req?.method || 'N/A';
    const url = req?.originalUrl || 'N/A';
    const statusCode = (err as any).statusCode || 500;

    const entry = [
      `════════════════════════════════════════════════════════`,
      `🕐 ${timestamp}`,
      `📍 ${method} ${url}`,
      `⚠️  Status: ${statusCode}`,
      `💬 Message: ${err.message}`,
      ...(err.stack ? [`📋 Stack:\n${err.stack}`] : []),
      ``,
    ].join('\n');

    try {
      fs.appendFileSync(LOG_FILE, entry + '\n', 'utf-8');
    } catch (writeErr) {
      // Fallback: if we can't write to file, at least log to console
      console.error('[Logger] Failed to write to error.log:', writeErr);
    }
  }
}

export const logger = new Logger();
