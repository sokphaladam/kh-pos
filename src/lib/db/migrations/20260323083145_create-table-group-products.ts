import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("group_products", (table) => {
    table.uuid("group_id").notNullable();
    table.uuid("product_id").notNullable();
    table.uuid("product_variant_id").notNullable();
    table.primary(["group_id", "product_id", "product_variant_id"]);
  });
}

export async function down(): Promise<void> {}
