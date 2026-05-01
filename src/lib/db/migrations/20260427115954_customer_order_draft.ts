import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("customer_order_draft", (table) => {
    table.increments("id").primary();
    table.json("content").notNullable();
    table.string("amount").notNullable();
    table.boolean("is_paid").defaultTo(false);
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.string("created_by").notNullable();
  });
}

export async function down(): Promise<void> {}
