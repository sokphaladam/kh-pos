import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("product_variant", (table) => {
    table.boolean("visible").defaultTo(true);
  });
}

export async function down(): Promise<void> {}
