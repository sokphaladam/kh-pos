import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("order_payment", (table) => {
    table.boolean("is_testing").defaultTo(false);
  });
}

export async function down(): Promise<void> {}
