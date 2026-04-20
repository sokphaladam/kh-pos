#!/usr/bin/env node
import dotenv from "dotenv";
import { cronService } from "./cron-service.js";
import { CronLogger } from "./cron-logger.js";

// Load environment variables
dotenv.config();

const logger = new CronLogger("Cron");

async function startCronJobs() {
  logger.info("🚀 Starting L-POS Cron Service");

  // Start all cron jobs
  cronService.startAll();

  logger.info("✅ Cron service initialized successfully");
  logger.info("   Press Ctrl+C to stop");

  // Log job status
  const status = cronService.getStatus();
  logger.info("📋 Active jobs:");
  Object.entries(status).forEach(([name, isActive]) => {
    logger.info(`   ${isActive ? "✓" : "✗"} ${name}`);
  });
}

// Graceful shutdown handlers
function shutdown(signal: string) {
  logger.info(`\n${signal} received, shutting down gracefully...`);
  cronService.stopAll();
  logger.info("✅ All cron jobs stopped");
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// Unhandled error handlers
process.on("unhandledRejection", (reason, promise) => {
  logger.error(
    "Unhandled Rejection",
    new Error(`Rejection at: ${promise}, reason: ${reason}`),
  );
  // Don't exit - log and continue
  logger.warn("Cron service continuing despite unhandled rejection");
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception", error);

  // Only exit on critical errors, not cron job failures
  const isCritical =
    error.message?.includes("ECONNREFUSED") ||
    error.message?.includes("Cannot find module");

  if (isCritical) {
    logger.error("Critical error detected - shutting down");
    shutdown("UNCAUGHT_EXCEPTION");
  } else {
    logger.warn("Non-critical error - cron service continuing");
  }
});

// Start the service
startCronJobs().catch((error) => {
  logger.error("Failed to start cron service:", error);
  process.exit(1);
});
