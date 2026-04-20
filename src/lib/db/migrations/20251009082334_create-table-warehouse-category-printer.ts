import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("warehouse_category_printer", (table) => {
    table.string("warehouse_id").notNullable();
    table.string("category_id").notNullable();
    table.string("printer_id").notNullable();
    table.primary(["warehouse_id", "category_id"]);
  });
}

export async function down(): Promise<void> {}
