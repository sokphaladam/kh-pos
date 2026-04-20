import { ScheduledTask } from "node-cron";
import { CronLogger } from "../cron-logger";
import cron from "node-cron";
import { createSafeJob } from "../safe-job-wrapper";
import moment from "moment-timezone";
import { getKnexSync } from "../../knex.js";
import { querySaleOrderReport } from "../helpers/sale-order-report";
import { generateId } from "../../generate-id.js";
import {
  table_account_booking,
  table_user,
} from "../../../generated/tables.js";
import { Formatter } from "../../../lib/formatter.js";

const logger = new CronLogger("DailyAccountBookingSaleOrderJob");

/**
 * Testable job function - can be called directly for testing
 */
export async function testDailyAccountBookingSaleOrderJob() {
  logger.info("Starting daily account booking sale order report generation...");

  const today = moment();

  const pastday = today.subtract(1, "day").format("YYYY-MM-DD");

  const db = getKnexSync();

  logger.info("Querying account booking sale order data...");

  const result = await db.transaction(async (trx) => {
    const reportData = await querySaleOrderReport(trx, {
      startDate: pastday,
      endDate: `${pastday} 23:59:59`,
      // startDate: "2026-03-31",
      // endDate: `2026-03-31 23:59:59`,
    });

    logger.info(`Found ${reportData.length} sale order records`);

    if (reportData.length === 0) {
      logger.warn("⚠️  No sale order data found for the specified date range");
      return {
        totalSaleOrders: 0,
        skipped: true,
      };
    }

    const rows: table_account_booking[] = [];
    const account = await trx
      .table("chart_of_account")
      .where({ account_name: "Sale Order" })
      .first();

    const accountId = account ? account.id : generateId();

    if (!account) {
      await db.table("chart_of_account").insert({
        id: accountId,
        account_name: "Sale Order",
        created_at: today.format("YYYY-MM-DD HH:mm:ss"),
        created_by: "cron-job",
        account_type: "revenue",
      });
    }

    for (const row of reportData) {
      const systemAdmin: table_user = await trx
        .table("user")
        .where({ is_system_admin: true, warehouse_id: row.warehouse_id })
        .first();
      const date = Formatter.date(row.paid_date);
      rows.push({
        id: generateId(),
        account_id: accountId,
        created_at: date,
        created_by: systemAdmin.id || "",
        description: `Sale Order ${date} (${row.name})`,
        amount: String(row.total_amount),
        warehouse_id: row.warehouse_id,
        deleted_at: null,
        deleted_by: null,
      });
    }

    logger.info(`Inserted ${rows.length} account booking records`);

    await trx.table("account_booking").insert(rows);

    logger.info(`Successfully inserted ${rows.length} account booking records`);

    return {
      total: rows.length,
    };
  });

  return result;
}

export function registerDailyAccountBookingSaleOrderJob(): ScheduledTask {
  const job = cron.schedule(
    "0 15 4 * * *",
    createSafeJob(
      "DailyAccountBookingSaleOrderJob",
      testDailyAccountBookingSaleOrderJob,
      {
        maxRetries: 2,
        retryDelay: 5000,
        enableDbLogging: true,
      },
    ),
    {
      timezone: process.env.TZ || "Asia/Phnom_Penh",
    },
  );

  logger.info("Daily account booking sale order job");

  return job;
}
