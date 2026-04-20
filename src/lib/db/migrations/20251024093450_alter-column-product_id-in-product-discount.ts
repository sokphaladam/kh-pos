import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("product_discount", (table) => {
    table.string("product_id").nullable().alter();
  });
}

export async function down(): Promise<void> {}
