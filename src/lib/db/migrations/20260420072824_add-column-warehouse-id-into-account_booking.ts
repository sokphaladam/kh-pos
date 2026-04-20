import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("account_booking", (table) => {
    table.string("warehouse_id").nullable().after("account_id");
  });
}

export async function down(): Promise<void> {}
