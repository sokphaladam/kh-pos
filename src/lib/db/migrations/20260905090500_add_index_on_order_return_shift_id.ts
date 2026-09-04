import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("order_return", (table) => {
    table.index("shift_id");
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("order_return", (table) => {
    table.dropIndex("shift_id");
  });
}
