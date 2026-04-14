import fs from 'fs';
import path from 'path';
import { Request } from 'express';

const LOG_FILE     = path.join(process.cwd(), 'error.log');
const MAX_SIZE     = 10 * 1024 * 1024;  // 10 MB
const ARCHIVE_FILE = path.join(process.cwd(), 'error.log.1');

/**
 * Simple file-based error logger.
 * Rotates error.log → error.log.1 when it exceeds 10 MB to prevent unbounded growth.
 */
class Logger {
  private rotate(): void {
    try {
      const stat = fs.statSync(LOG_FILE);
      if (stat.size >= MAX_SIZE) {
        // Overwrite previous archive and rotate
        if (fs.existsSync(ARCHIVE_FILE)) fs.unlinkSync(ARCHIVE_FILE);
        fs.renameSync(LOG_FILE, ARCHIVE_FILE);
      }
    } catch {
      // File may not exist yet — ignore
    }
  }

  logError(err: Error, req?: Request): void {
    this.rotate();

    const timestamp  = new Date().toISOString();
    const method     = req?.method || 'N/A';
    const url        = req?.originalUrl || 'N/A';
    const statusCode = (err as any).statusCode || 500;

    // Only log the first line of the stack to avoid leaking internal paths in bulk
    const stackFirstLine = err.stack?.split('\n').slice(0, 4).join('\n') || '';

    const entry = [
      `════════════════════════════════════════════════════════`,
      `🕐 ${timestamp}`,
      `📍 ${method} ${url}`,
      `⚠️  Status: ${statusCode}`,
      `💬 Message: ${err.message}`,
      ...(stackFirstLine ? [`📋 Stack:\n${stackFirstLine}`] : []),
      ``,
    ].join('\n');

    try {
      fs.appendFileSync(LOG_FILE, entry + '\n', 'utf-8');
    } catch (writeErr) {
      console.error('[Logger] Failed to write to error.log:', writeErr);
    }
  }
}

export const logger = new Logger();
