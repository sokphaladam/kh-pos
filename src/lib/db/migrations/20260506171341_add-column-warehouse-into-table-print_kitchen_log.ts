import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("print_kitchen_log", (table) => {
    table.string("warehouse_id");
    table.string("created_by");
    table.dateTime("created_at").defaultTo(knex.fn.now());
  });
}

export async function down(): Promise<void> {}
