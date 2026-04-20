import { Knex } from "knex";
// Don't extend BaseRepository to avoid ES module conflicts in cron context

export interface CronLog {
  id: number;
  job_name: string;
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  status: "success" | "failed" | "skipped" | "retrying";
  error_message: string | null;
  error_stack: string | null;
  retry_count: number;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface CronLogInput {
  job_name: string;
  started_at: string;
  finished_at?: string | null;
  duration_ms?: number | null;
  status: "success" | "failed" | "skipped" | "retrying";
  error_message?: string | null;
  error_stack?: string | null;
  retry_count?: number;
  metadata?: Record<string, unknown> | null;
}

export default class CronLogRepository {
  private tableName = "cron_log";

  constructor(private tx: Knex) {}

  /**
   * Create a new cron log entry
   */
  async createLog(input: CronLogInput): Promise<number> {
    const [id] = await this.tx.table<CronLog>(this.tableName).insert({
      job_name: input.job_name,
      started_at: input.started_at,
      finished_at: input.finished_at || null,
      duration_ms: input.duration_ms || null,
      status: input.status,
      error_message: input.error_message || null,
      error_stack: input.error_stack || null,
      retry_count: input.retry_count || 0,
      metadata: input.metadata || null,
    });
    return id;
  }

  /**
   * Update an existing cron log entry
   */
  async updateLog(
    id: number,
    updates: Partial<Omit<CronLogInput, "job_name" | "started_at">>,
  ): Promise<boolean> {
    const updateData: Record<string, unknown> = {};

    if (updates.finished_at !== undefined)
      updateData.finished_at = updates.finished_at;
    if (updates.duration_ms !== undefined)
      updateData.duration_ms = updates.duration_ms;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.error_message !== undefined)
      updateData.error_message = updates.error_message;
    if (updates.error_stack !== undefined)
      updateData.error_stack = updates.error_stack;
    if (updates.retry_count !== undefined)
      updateData.retry_count = updates.retry_count;
    if (updates.metadata !== undefined) {
      updateData.metadata = updates.metadata || null;
    }

    await this.tx
      .table<CronLog>(this.tableName)
      .where({ id })
      .update(updateData);
    return true;
  }

  /**
   * Get recent logs for a specific job
   */
  async getRecentLogs(jobName: string, limit: number = 50): Promise<CronLog[]> {
    return this.tx
      .table<CronLog>(this.tableName)
      .where({ job_name: jobName })
      .orderBy("started_at", "desc")
      .limit(limit)
      .select("*");
  }

  /**
   * Get logs by status
   */
  async getLogsByStatus(
    status: "success" | "failed" | "skipped" | "retrying",
    limit: number = 100,
  ): Promise<CronLog[]> {
    return this.tx
      .table<CronLog>(this.tableName)
      .where({ status })
      .orderBy("started_at", "desc")
      .limit(limit)
      .select("*");
  }

  /**
   * Get logs within a date range
   */
  async getLogsByDateRange(
    startDate: string,
    endDate: string,
    jobName?: string,
  ): Promise<CronLog[]> {
    const query = this.tx
      .table<CronLog>(this.tableName)
      .whereBetween("started_at", [startDate, endDate]);

    if (jobName) {
      query.where({ job_name: jobName });
    }

    return query.orderBy("started_at", "desc").select("*");
  }

  /**
   * Get execution statistics for a job
   */
  async getJobStats(jobName: string, days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await this.tx
      .table<CronLog>(this.tableName)
      .where({ job_name: jobName })
      .where("started_at", ">=", startDate.toISOString())
      .select(
        this.tx.raw("COUNT(*) as total_runs"),
        this.tx.raw(
          "SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful_runs",
        ),
        this.tx.raw(
          "SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_runs",
        ),
        this.tx.raw("AVG(duration_ms) as avg_duration"),
        this.tx.raw("MAX(duration_ms) as max_duration"),
        this.tx.raw("MIN(duration_ms) as min_duration"),
      )
      .first();

    return stats;
  }

  /**
   * Clean up old logs (keep data for retention period)
   */
  async cleanupOldLogs(retentionDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const deleted = await this.tx
      .table<CronLog>(this.tableName)
      .where("started_at", "<", cutoffDate.toISOString())
      .delete();

    return deleted;
  }
}
