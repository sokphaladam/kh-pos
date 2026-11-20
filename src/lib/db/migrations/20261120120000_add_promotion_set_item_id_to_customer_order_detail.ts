import type { Knex } from "knex";

/**
 * The promotion slot (`promotion_set_item.id`) an order line was added for.
 * Pins the line to that slot so the promotion engine keeps the cashier's
 * choice of which item is full price and which is free, and plain items added
 * later don't get mixed into the set.
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("customer_order_detail", (table) => {
    table.string("promotion_set_item_id", 50).nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("customer_order_detail", (table) => {
    table.dropColumn("promotion_set_item_id");
  });
}
