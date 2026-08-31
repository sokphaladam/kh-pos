import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("customer_order", (table) => {
    table.index("paid_at");
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("customer_order", (table) => {
    table.dropIndex("paid_at");
  });
}
