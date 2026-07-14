import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("print_kitchen_log", (table) => {
    table.index("order_detail_id");
    table.index("order_id");
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("print_kitchen_log", (table) => {
    table.dropIndex("order_detail_id");
    table.dropIndex("order_id");
  });
}
