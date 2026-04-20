import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("restaurant_tables", (table) => {
    table.string("position_x");
    table.string("position_y");
  });
}

export async function down(): Promise<void> {}
