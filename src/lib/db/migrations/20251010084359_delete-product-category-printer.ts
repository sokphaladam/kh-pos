import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("product_category", (table) => {
    table.dropColumn("printer_id");
  });
}

export async function down(): Promise<void> {}
