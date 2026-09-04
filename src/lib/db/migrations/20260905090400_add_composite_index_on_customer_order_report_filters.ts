import type { Knex } from "knex";

// Covers the report/dashboard query pattern used by end-of-day, sale-by-category
// and metrics reports, which always filter customer_order by these three
// columns together: warehouse_id + order_status ('COMPLETED') + paid_at range.
export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("customer_order", (table) => {
    table.index(
      ["warehouse_id", "order_status", "paid_at"],
      "idx_customer_order_warehouse_status_paid_at"
    );
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("customer_order", (table) => {
    table.dropIndex(
      ["warehouse_id", "order_status", "paid_at"],
      "idx_customer_order_warehouse_status_paid_at"
    );
  });
}
