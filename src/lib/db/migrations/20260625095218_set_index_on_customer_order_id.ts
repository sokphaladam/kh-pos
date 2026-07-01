import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("customer_order", (table) => {
    table.index("order_id");
  });
}

export async function down(): Promise<void> {}
