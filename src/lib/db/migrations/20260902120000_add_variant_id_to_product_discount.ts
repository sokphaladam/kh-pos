import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("product_discount", (table) => {
    // Non-null => discount targets only this variant of `product_id`.
    // Null with a `product_id` => discount targets every variant of that product.
    table.string("variant_id").nullable().index();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("product_discount", (table) => {
    table.dropColumn("variant_id");
  });
}
