import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return await knex.schema.alterTable("customer_order", (table) => {
    table
      .enum("served_type", ["dine_in", "take_away", "food_delivery"])
      .notNullable()
      .defaultTo("dine_in");
    table.string("delivery_code").nullable();
  });
}

export async function down(): Promise<void> {}
