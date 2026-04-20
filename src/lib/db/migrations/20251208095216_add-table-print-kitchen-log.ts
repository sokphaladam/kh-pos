import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("print_kitchen_log", (table) => {
    table.increments("id").primary();
    table.string("order_id").notNullable();
    table.string("order_detail_id").notNullable();
    table.string("item_price").notNullable();
    table.timestamp("printed_at").defaultTo(knex.fn.now()).notNullable();
    table.json("content");
    table.json("printer_info");
  });
}

export async function down(): Promise<void> {}
