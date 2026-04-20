import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("seat_reservation", (table) => {
    table.decimal("price", 12, 2).notNullable().defaultTo(0);
  });
}

export async function down(): Promise<void> {}
