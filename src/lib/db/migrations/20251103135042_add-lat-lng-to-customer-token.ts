import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.table("customer_token", (table) => {
    table.decimal("lat", 10, 7).nullable();
    table.decimal("lng", 10, 7).nullable();
  });
}

export async function down(): Promise<void> {}
