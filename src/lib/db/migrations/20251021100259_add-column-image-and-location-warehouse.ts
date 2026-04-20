import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("warehouse", (table) => {
    table.string("image").nullable();
    table.string("lat").nullable();
    table.string("lng").nullable();
  });
}

export async function down(): Promise<void> {}
