#!/usr/bin/env node
/**
 * Cron job runner - Execute any cron job immediately for testing
 *
 * Usage: npm run cron-job <job-file-name>
 * Examples:
 *   npm run cron-job daily-product-report
 *   npm run cron-job test-database
 */

import dotenv from "dotenv";
import { readdirSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { CronLogger } from "./lib/cron/cron-logger.js";

// Load environment variables
dotenv.config();

const logger = new CronLogger("CronJobRunner");

// Get the directory of this script
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Convert kebab-case to PascalCase
 * Example: "daily-product-report" -> "DailyProductReport"
 */
function toPascalCase(str: string): string {
  return str
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

/**
 * Get list of available cron jobs from the jobs directory
 */
function getAvailableJobs(): string[] {
  const jobsDir = join(__dirname, "lib", "cron", "jobs");
  try {
    const files = readdirSync(jobsDir);
    return files
      .filter((file) => file.endsWith(".ts") || file.endsWith(".js"))
      .map((file) => file.replace(/\.(ts|js)$/, ""))
      .sort();
  } catch (error) {
    logger.error("Error reading jobs directory:", error);
    return [];
  }
}

async function runCronJob() {
  const jobName = process.argv[2];

  if (!jobName) {
    logger.error("❌ Error: Job name is required");
    logger.info("\n📋 Available cron jobs:");
    const jobs = getAvailableJobs();
    jobs.forEach((job) => {
      logger.info(`   - ${job}`);
    });
    logger.info("\n💡 Usage: npm run cron-job <job-file-name>");
    logger.info("   Example: npm run cron-job daily-product-report");
    process.exit(1);
  }

  try {
    logger.info(`🚀 Running cron job: ${jobName}`);
    logger.info("━".repeat(60));

    // Build the module path
    const modulePath = `./lib/cron/jobs/${jobName}.js`;

    // Dynamically import the module
    logger.info(`Importing module: ${modulePath}`);
    const jobModule = await import(modulePath);

    // Build the test function name: test{PascalCase}Job
    // Example: "daily-product-report" -> "testDailyProductReportJob"
    const testFunctionName = `test${toPascalCase(jobName)}Job`;
    const testFunction = jobModule[testFunctionName];

    if (typeof testFunction === "function") {
      logger.info(`✓ Executing: ${testFunctionName}()`);
      const result = await testFunction();

      logger.info("━".repeat(60));
      logger.info("✅ Job completed successfully!");

      if (result) {
        logger.info("\n📊 Result:");
        logger.info(JSON.stringify(result, null, 2));
      }
    } else {
      logger.error(
        `❌ Error: Test function "${testFunctionName}" not found in module`,
      );
      logger.info(
        `💡 Make sure to export: export async function ${testFunctionName}() { ... }`,
      );
      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    logger.error("❌ Job failed:", error);
    if (error instanceof Error && error.stack) {
      logger.error(error.stack);
    }

    // Show available jobs on error
    logger.info("\n📋 Available cron jobs:");
    const jobs = getAvailableJobs();
    jobs.forEach((job) => {
      logger.info(`   - ${job}`);
    });

    process.exit(1);
  }
}

// Run the job
runCronJob();
