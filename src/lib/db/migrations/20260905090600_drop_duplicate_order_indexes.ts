import type { Knex } from "knex";

// Removes indexes that duplicate an existing one and only add write overhead:
// - customer_order.customer_order_order_id_index duplicates the PRIMARY KEY (order_id).
// - customer_order_detail.customer_order_detail_order_id_index duplicates
//   idx_customer_order_detail_order_id (both are a plain index on order_id).
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("customer_order", (table) => {
    table.dropIndex("order_id", "customer_order_order_id_index");
  });
  await knex.schema.alterTable("customer_order_detail", (table) => {
    table.dropIndex("order_id", "customer_order_detail_order_id_index");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("customer_order", (table) => {
    table.index("order_id", "customer_order_order_id_index");
  });
  await knex.schema.alterTable("customer_order_detail", (table) => {
    table.index("order_id", "customer_order_detail_order_id_index");
  });
}
