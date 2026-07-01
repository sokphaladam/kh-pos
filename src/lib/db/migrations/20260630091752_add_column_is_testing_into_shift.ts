import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("shift", (table) => {
    table.boolean("is_testing").defaultTo(false);
  });
}

export async function down(): Promise<void> {}
