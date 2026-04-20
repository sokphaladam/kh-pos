import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("chart_of_account", (table) => {
    table.dateTime("deleted_at").nullable();
    table.string("deleted_by").nullable();
  });
}

export async function down(): Promise<void> {}
