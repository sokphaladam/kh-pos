import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("product_variant", (table) => {
    // Optional "menu discount" shown on the POS grid / public menu and
    // auto-applied when the variant is added to an order.
    table.enum("discount_type", ["AMOUNT", "PERCENTAGE"]).nullable();
    table.decimal("discount_value", 12, 2).nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("product_variant", (table) => {
    table.dropColumn("discount_type");
    table.dropColumn("discount_value");
  });
}
