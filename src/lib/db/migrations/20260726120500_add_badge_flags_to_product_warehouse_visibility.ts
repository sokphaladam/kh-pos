import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("product_warehouse_visibility", (table) => {
    table.boolean("is_top_sale").nullable();
    table.boolean("is_new").nullable();
    table.boolean("is_most_order").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("product_warehouse_visibility", (table) => {
    table.dropColumn("is_top_sale");
    table.dropColumn("is_new");
    table.dropColumn("is_most_order");
  });
}
