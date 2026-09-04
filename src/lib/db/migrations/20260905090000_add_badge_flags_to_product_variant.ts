import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("product_variant", (table) => {
    // Admin-set menu badges shown on the public menu / POS restaurant screen.
    // Tagged variants are sorted to the top of their category.
    table.boolean("is_popular").notNullable().defaultTo(false);
    table.boolean("is_new").notNullable().defaultTo(false);
    table.boolean("is_most_order").notNullable().defaultTo(false);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("product_variant", (table) => {
    table.dropColumn("is_popular");
    table.dropColumn("is_new");
    table.dropColumn("is_most_order");
  });
}
