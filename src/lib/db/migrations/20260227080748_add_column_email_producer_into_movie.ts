import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("movie", (table) => {
    table.json("email_producer").nullable();
  });
}

export async function down(): Promise<void> {}
