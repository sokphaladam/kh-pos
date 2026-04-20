import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("user", (table) => {
    table.dropColumn("app");
    table.dropColumn("is_root");
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("user", (table) => {
    table.string("app");
    table.boolean("is_root");
  });
}
