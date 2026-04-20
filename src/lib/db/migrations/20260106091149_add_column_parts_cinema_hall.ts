import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("cinema_hall", (table) => {
    table.json("parts").nullable();
  });
}

export async function down(): Promise<void> {}
