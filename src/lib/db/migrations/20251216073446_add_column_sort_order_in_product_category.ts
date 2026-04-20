import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("product_category", (table) => {
    table.integer("sort_order").defaultTo(0).notNullable();
  });
}

export async function down(): Promise<void> {}
