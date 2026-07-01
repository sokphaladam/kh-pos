import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("print_kitchen_log", (table) => {
    table.boolean("is_testing").defaultTo(false);
  });
}

export async function down(): Promise<void> {}
