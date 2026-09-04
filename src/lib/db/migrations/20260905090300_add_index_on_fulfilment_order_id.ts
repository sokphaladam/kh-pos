import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("fulfilment", (table) => {
    table.index("order_id");
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("fulfilment", (table) => {
    table.dropIndex("order_id");
  });
}
