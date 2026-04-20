import { ScheduledTask } from "node-cron";
import cron from "node-cron";
import { getKnexSync } from "../../knex.js";
import { CronLogger } from "../cron-logger.js";
import { createSafeJob } from "../safe-job-wrapper.js";
import { Email } from "../../email/email-service.js";
import { PdfGenerator } from "../../pdf-generator.js";
import {
  queryProductListData,
  generateProductListHtml,
  generateProductReportEmail,
} from "../helpers/product-list-report.js";

const logger = new CronLogger("DailyProductReportJob");

/**
 * Testable job function - can be called directly for testing
 */
export async function testDailyProductReportJob() {
  logger.info("Starting daily product report generation...");

  const db = getKnexSync();

  // Query product data from database
  logger.info("Querying product data...");
  const reportData = await queryProductListData(db);
  logger.info(
    `Found ${reportData.summary.totalProducts} products with ${reportData.summary.totalVariants} variants`,
  );

  if (reportData.items.length === 0) {
    logger.warn("⚠️  No products found in database");
    return {
      totalProducts: 0,
      totalVariants: 0,
      totalStock: 0,
      skipped: true,
    };
  }

  // Generate HTML for PDF
  const html = generateProductListHtml(reportData);

  // Generate PDF from HTML
  logger.info("Generating PDF...");
  const pdfPath = await PdfGenerator.generateFromHtml(html, {
    format: "A4",
    margin: {
      top: "20mm",
      bottom: "20mm",
      left: "15mm",
      right: "15mm",
    },
  });
  logger.info(`PDF generated successfully at: ${pdfPath}`);

  // Generate email HTML
  const emailHtml = generateProductReportEmail(reportData);

  // Check if we should skip email (useful for testing)
  const skipEmail = process.env.SKIP_EMAIL === "true";

  if (!skipEmail) {
    // Send email with PDF attachment
    const recipientEmail = "2keppere@gmail.com";
    const currentDate = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    logger.info(`Sending report to ${recipientEmail}...`);

    await Email.sendMailgunWithAttachments(
      recipientEmail,
      `Daily Product Inventory Report - ${currentDate}`,
      emailHtml,
      [
        {
          filename: `product-list-${new Date().toISOString().split("T")[0]}.pdf`,
          path: pdfPath,
        },
      ],
    );

    logger.info("✓ Daily product report sent successfully");
  } else {
    logger.info("⏭️  Skipping email (set SKIP_EMAIL=true)");
    logger.info(`📄 PDF saved at: ${pdfPath}`);
  }

  // Return metadata for database logging
  return {
    totalProducts: reportData.summary.totalProducts,
    totalVariants: reportData.summary.totalVariants,
    totalStock: reportData.summary.totalStock,
    recipientEmail: skipEmail ? null : "2keppere@gmail.com",
    pdfGenerated: true,
    pdfPath,
    emailSent: !skipEmail,
  };
}

export function registerDailyProductReportJob(): ScheduledTask {
  // Schedule to run daily at 9:00 AM
  // Cron format: second minute hour day month dayOfWeek
  // "0 0 9 * * *" = At 9:00 AM every day
  const job = cron.schedule(
    "0 0 9 * * *",
    createSafeJob("DailyProductReportJob", testDailyProductReportJob, {
      maxRetries: 2,
      retryDelay: 5000,
      enableDbLogging: true,
    }),
    {
      timezone: process.env.TZ || "Asia/Phnom_Penh",
    },
  );

  logger.info(
    `Daily product report job registered (runs at 9:00 AM daily) with timezone: ${process.env.TZ || "Asia/Phnom_Penh"}`,
  );

  return job;
}
