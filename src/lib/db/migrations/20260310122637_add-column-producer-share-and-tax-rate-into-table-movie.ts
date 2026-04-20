import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("movie", (table) => {
    table.integer("producer_share").defaultTo(0);
    table.integer("tax_rate").defaultTo(0);
  });
}

export async function down(): Promise<void> {}
