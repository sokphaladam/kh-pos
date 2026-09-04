import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("fulfilment_detail", (table) => {
    table.index("transaction_id");
    table.index("fulfilment_id");
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("fulfilment_detail", (table) => {
    table.dropIndex("transaction_id");
    table.dropIndex("fulfilment_id");
  });
}
