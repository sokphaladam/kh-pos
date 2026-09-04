import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("order_payment", (table) => {
    table.index("order_id");
    table.index("shift_id");
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("order_payment", (table) => {
    table.dropIndex("order_id");
    table.dropIndex("shift_id");
  });
}
