import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("product_warehouse_visibility", (table) => {
    // Per-branch override of the product_variant menu badges. Null means
    // "inherit the main warehouse's flag"; true/false is an explicit
    // override set by the sub-warehouse itself.
    table.boolean("is_popular").nullable();
    table.boolean("is_new").nullable();
    table.boolean("is_most_order").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("product_warehouse_visibility", (table) => {
    table.dropColumn("is_popular");
    table.dropColumn("is_new");
    table.dropColumn("is_most_order");
  });
}
