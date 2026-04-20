import { ScheduledTask } from "node-cron";
import cron from "node-cron";
import { getKnexSync } from "../../knex.js";
import { CronLogger } from "../cron-logger.js";
import { createSafeJob } from "../safe-job-wrapper.js";

const logger = new CronLogger("TestDatabaseJob");

/**
 * Testable job function - can be called directly for testing
 */
export async function testTestDatabaseJob() {
  const db = getKnexSync();

  // Simple query to test database connection
  const result = await db("product")
    .whereNull("deleted_at")
    .count("id as total")
    .first();

  const totalProducts = Number(result?.total || 0);

  logger.info(`✓ Database test successful - Total products: ${totalProducts}`);

  // Optional: Query more data to verify connection
  const recentProducts = await db("product")
    .whereNull("deleted_at")
    .orderBy("created_at", "desc")
    .limit(3)
    .select("id", "title");

  if (recentProducts.length > 0) {
    logger.info(
      `Recent products: ${recentProducts.map((p) => p.title).join(", ")}`,
    );
  }

  // Return metadata for database logging
  return {
    recordsProcessed: totalProducts,
    recentProductsChecked: recentProducts.length,
    productNames: recentProducts.map((p) => p.title),
  };
}

export function registerTestDatabaseJob(): ScheduledTask {
  // Using safe wrapper - automatically retries on failure and logs to database
  const job = cron.schedule(
    "0 10 17 * * *",
    createSafeJob("TestDatabaseJob", testTestDatabaseJob, {
      maxRetries: 2,
      retryDelay: 2000,
      enableDbLogging: true,
    }),
  );

  logger.info(
    "Scheduled database test job (runs every 30 seconds for testing)",
  );
  return job;
}
