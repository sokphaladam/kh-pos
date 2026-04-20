import { CronLogger } from "./cron-logger.js";
import { getKnexSync } from "../knex.js";
import { Formatter } from "../formatter.js";

export interface JobExecutionMetadata {
  recordsProcessed?: number;
  recordsUpdated?: number;
  recordsDeleted?: number;
  recordsSkipped?: number;
  emailsSent?: number;
  [key: string]: unknown;
}

/**
 * Wraps a job function with error handling, retry logic, and database logging
 */
export async function safeJobExecution(
  jobName: string,
  jobFn: () => Promise<JobExecutionMetadata | void>,
  options: {
    maxRetries?: number;
    retryDelay?: number; // in milliseconds
    enableDbLogging?: boolean;
  } = {},
): Promise<void> {
  const { maxRetries = 0, retryDelay = 1000, enableDbLogging = true } = options;
  const logger = new CronLogger(jobName);

  let db = null;
  let logId: number | null = null;

  const startTime = Formatter.getNowDateTime();

  // Initialize database connection for logging
  if (enableDbLogging) {
    try {
      db = getKnexSync();

      // Create initial log entry
      const [id] = await db.table("cron_log").insert({
        job_name: jobName,
        started_at: startTime,
        status: "retrying",
        retry_count: 0,
      });
      logId = Number(id);
    } catch (error) {
      logger.error("Failed to initialize database logging", error as Error);
      // Continue without database logging
      db = null;
      logId = null;
    }
  }

  let attempt = 0;
  let lastError: Error | undefined;
  let metadata: JobExecutionMetadata | undefined;

  while (attempt <= maxRetries) {
    try {
      // Execute the job
      const result = await jobFn();
      if (result) {
        metadata = result;
      }

      // Success - log and exit
      const duration =
        new Date(Formatter.getNowDateTime()).getTime() -
        new Date(startTime).getTime();
      const finishedAt = Formatter.getNowDateTime();

      if (db && logId) {
        await db
          .table("cron_log")
          .where({ id: logId })
          .update({
            finished_at: finishedAt,
            duration_ms: duration,
            status: "success",
            retry_count: attempt,
            metadata: metadata ? JSON.stringify(metadata) : null,
          });
      }

      logger.info(
        `Completed successfully in ${duration}ms${attempt > 0 ? ` after ${attempt} retry(ies)` : ""}`,
      );
      return;
    } catch (error) {
      lastError = error as Error;
      attempt++;

      // Update log with retry status
      if (db && logId) {
        await db
          .table("cron_log")
          .where({ id: logId })
          .update({
            status: attempt <= maxRetries ? "retrying" : "failed",
            retry_count: attempt,
            error_message: lastError.message,
            error_stack: lastError.stack || null,
          });
      }

      if (attempt <= maxRetries) {
        logger.warn(
          `Job failed (attempt ${attempt}/${maxRetries + 1}), retrying in ${retryDelay}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }

  // All retries exhausted - log final failure
  const duration =
    new Date(Formatter.getNowDateTime()).getTime() -
    new Date(startTime).getTime();
  const finishedAt = Formatter.getNowDateTime();

  if (db && logId) {
    await db
      .table("cron_log")
      .where({ id: logId })
      .update({
        finished_at: finishedAt,
        duration_ms: duration,
        status: "failed",
        retry_count: attempt,
        error_message: lastError!.message,
        error_stack: lastError!.stack || null,
      });
  }

  logger.error(`Job failed after ${maxRetries + 1} attempts`, lastError!);
}

/**
 * Creates a safe job wrapper with automatic error recovery and database logging
 *
 * @example
 * const job = cron.schedule('* * * * *',
 *   createSafeJob('MyJob', async () => {
 *     // Your job logic
 *     return { recordsProcessed: 10 }; // Optional metadata
 *   }, { maxRetries: 2, enableDbLogging: true })
 * );
 */
export function createSafeJob(
  jobName: string,
  jobFn: () => Promise<JobExecutionMetadata | void>,
  options?: {
    maxRetries?: number;
    retryDelay?: number;
    enableDbLogging?: boolean;
  },
): () => Promise<void> {
  return async () => {
    await safeJobExecution(jobName, jobFn, options);
  };
}
