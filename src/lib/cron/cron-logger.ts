/**
 * Simple console logger for cron jobs (not database-backed)
 */
export class CronLogger {
  constructor(private context: string) {}

  private formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] [${this.context}] ${message}`;
  }

  info(message: string) {
    console.info(this.formatMessage("INFO", message));
  }

  warn(message: string) {
    console.warn(this.formatMessage("WARN", message));
  }

  error(message: string, error?: unknown) {
    let errorMessage = "";
    try {
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error !== undefined && error !== null) {
        errorMessage = JSON.stringify(error);
      }
    } catch {
      errorMessage = "[Unable to stringify error]";
    }

    const fullMessage = errorMessage ? `${message} ${errorMessage}` : message;
    console.error(this.formatMessage("ERROR", fullMessage));
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
  }

  debug(message: string) {
    console.debug(this.formatMessage("DEBUG", message));
  }
}
