import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("customer_order_detail", (table) => {
    table.boolean("is_testing").defaultTo(false);
  });
}

export async function down(): Promise<void> {}
