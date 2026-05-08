import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("product_warehouse_visibility", (table) => {
    table.uuid("id").primary();
    table.string("warehouse_id").notNullable();
    table.string("product_id").notNullable();
    table.string("product_variant_id").notNullable();
    table
      .boolean("is_visible")
      .defaultTo(true)
      .comment("visible in this warehouse POS");
    table
      .boolean("is_for_sale")
      .defaultTo(true)
      .comment("available for sale in this warehouse POS");
    table.timestamps(true, true);
  });
}

export async function down(): Promise<void> {}
