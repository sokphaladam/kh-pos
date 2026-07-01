import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("discount_log", (table) => {
    table.index("order_detail_id");
  });
}

export async function down(): Promise<void> {}
