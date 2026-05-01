import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("customer_order", (table) => {
    table
      .enum("served_type", [
        "dine_in",
        "take_away",
        "food_delivery",
        "customer",
      ])
      .defaultTo("dine_in")
      .alter();
  });
}

export async function down(): Promise<void> {}
