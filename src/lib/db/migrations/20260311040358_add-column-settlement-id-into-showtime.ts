import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("showtime", (table) => {
    table.string("settlement_id").nullable().defaultTo(null);
  });
}

export async function down(): Promise<void> {}
