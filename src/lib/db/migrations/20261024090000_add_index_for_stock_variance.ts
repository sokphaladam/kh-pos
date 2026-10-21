import type { Knex } from "knex";

// Indexes for the stock variance report.
//
// - idx_inventory_transactions_created_at: the report reads movements from the
//   period start onward; without it every run scans the whole ledger.
// - idx_stock_waste_transaction_transaction: classifies DAMAGE movements as
//   waste or non-sale by transaction id (the primary key starts at waste_id).
//
// Live databases may already have an index starting with these columns (some
// were added by hand), so each is only created when none exists.
const INDEXES = [
  {
    table: "inventory_transactions",
    column: "created_at",
    name: "idx_inventory_transactions_created_at",
  },
  {
    table: "stock_waste_transaction",
    column: "transaction_id",
    name: "idx_stock_waste_transaction_transaction",
  },
];

async function indexStartingWith(knex: Knex, table: string, column: string) {
  const [rows] = await knex.raw(
    `SELECT index_name AS name FROM information_schema.statistics
     WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ? AND seq_in_index = 1
     LIMIT 1`,
    [table, column],
  );
  return (rows as { name: string }[])[0]?.name ?? null;
}

export async function up(knex: Knex): Promise<void> {
  for (const { table, column, name } of INDEXES) {
    if (!(await indexStartingWith(knex, table, column))) {
      await knex.raw(`CREATE INDEX ${name} ON ${table} (${column})`);
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  // Only drop the indexes this migration created (by name).
  for (const { table, name } of INDEXES) {
    const [rows] = await knex.raw(
      `SELECT 1 FROM information_schema.statistics
       WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ? LIMIT 1`,
      [table, name],
    );
    if ((rows as unknown[]).length > 0) {
      await knex.raw(`DROP INDEX ${name} ON ${table}`);
    }
  }
}
