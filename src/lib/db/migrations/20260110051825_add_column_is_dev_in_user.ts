import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("user", (table) => {
    table.boolean("is_dev").notNullable().defaultTo(false);
  });
}

export async function down(): Promise<void> {}
