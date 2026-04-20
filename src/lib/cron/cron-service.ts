import { ScheduledTask } from "node-cron";
import { CronLogger } from "./cron-logger.js";
import { registerTestDatabaseJob } from "./jobs/test-database.js";
import { registerDailyProductReportJob } from "./jobs/daily-product-report.js";
import { registerDailyMovieShowtimeReportJob } from "./jobs/daily-movie-showtime-report.js";
import { registerDailyAccountBookingMovieShowtimeJob } from "./jobs/daily-account-booking-movie-showtime.js";
import { registerDailyAccountBookingSaleOrderJob } from "./jobs/daily-account-booking-sale-order.js";

const logger = new CronLogger("CronService");

export class CronService {
  private jobs: Map<string, ScheduledTask> = new Map();

  /**
   * Start all registered cron jobs
   */
  startAll() {
    this.jobs.set("testDatabase", registerTestDatabaseJob());
    this.jobs.set("dailyProductReport", registerDailyProductReportJob());
    this.jobs.set(
      "dailyMovieShowtimeReport",
      registerDailyMovieShowtimeReportJob(),
    );
    this.jobs.set(
      "dailyAccountBookingMovieShowtime",
      registerDailyAccountBookingMovieShowtimeJob(),
    );
    this.jobs.set(
      "dailyAccountBookingSaleOrder",
      registerDailyAccountBookingSaleOrderJob(),
    );

    logger.info(`Started ${this.jobs.size} cron jobs`);

    // Log all scheduled jobs
    this.jobs.forEach((job, name) => {
      logger.info(`  - ${name}: active`);
    });
  }

  /**
   * Stop all cron jobs
   */
  stopAll() {
    this.jobs.forEach((job, name) => {
      job.stop();
      logger.info(`Stopped job: ${name}`);
    });
    this.jobs.clear();
  }

  /**
   * Get status of all jobs
   */
  getStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {};
    this.jobs.forEach((job, name) => {
      status[name] = true; // running
    });
    return status;
  }
}

export const cronService = new CronService();
