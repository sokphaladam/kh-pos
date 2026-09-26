import type { Knex } from "knex";

// Indexes for the order list (/api/pos/order) and the restaurant table poll.
//
// - idx_customer_order_warehouse_order_date: functional index matching the
//   order list date filter `COALESCE(paid_at, created_at)`, so a date range is
//   an index range scan instead of reading every order of the warehouse.
// - idx_customer_order_warehouse_created_at: lets the unfiltered list use the
//   index order for `ORDER BY created_at DESC LIMIT n` instead of a filesort.
// - idx_customer_order_order_status_table_number: used by /api/table to find
//   open orders per table. It already exists on some databases (added by hand),
//   so it is only created when missing.
const ORDER_DATE_INDEX = "idx_customer_order_warehouse_order_date";
const CREATED_AT_INDEX = "idx_customer_order_warehouse_created_at";
const TABLE_NUMBER_INDEX = "idx_customer_order_order_status_table_number";

async function hasIndex(knex: Knex, indexName: string) {
  const [rows] = await knex.raw(
    `SELECT 1 FROM information_schema.statistics
     WHERE table_schema = DATABASE() AND table_name = 'customer_order' AND index_name = ?
     LIMIT 1`,
    [indexName],
  );
  return rows.length > 0;
}

export async function up(knex: Knex): Promise<void> {
  if (!(await hasIndex(knex, ORDER_DATE_INDEX))) {
    await knex.raw(
      `CREATE INDEX ${ORDER_DATE_INDEX} ON customer_order (warehouse_id, (COALESCE(paid_at, created_at)))`,
    );
  }
  if (!(await hasIndex(knex, CREATED_AT_INDEX))) {
    await knex.raw(
      `CREATE INDEX ${CREATED_AT_INDEX} ON customer_order (warehouse_id, created_at)`,
    );
  }
  if (!(await hasIndex(knex, TABLE_NUMBER_INDEX))) {
    await knex.raw(
      `CREATE INDEX ${TABLE_NUMBER_INDEX} ON customer_order (order_status, table_number)`,
    );
  }
}

export async function down(knex: Knex): Promise<void> {
  // The table_number index may predate this migration, so it is left in place.
  if (await hasIndex(knex, ORDER_DATE_INDEX)) {
    await knex.raw(`DROP INDEX ${ORDER_DATE_INDEX} ON customer_order`);
  }
  if (await hasIndex(knex, CREATED_AT_INDEX)) {
    await knex.raw(`DROP INDEX ${CREATED_AT_INDEX} ON customer_order`);
  }
}
