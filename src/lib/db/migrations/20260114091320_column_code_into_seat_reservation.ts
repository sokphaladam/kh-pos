import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("seat_reservation", (table) => {
    table.string("code").nullable().after("seat_id");
  });
}

export async function down(): Promise<void> {}
