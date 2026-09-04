import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("print_kitchen_log", (table) => {
    table.index("printed_at");
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("print_kitchen_log", (table) => {
    table.dropIndex("printed_at");
  });
}
