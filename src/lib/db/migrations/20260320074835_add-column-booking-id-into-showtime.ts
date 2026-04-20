import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("showtime", (table) => {
    table.string("booking_id").nullable();
  });
}

export async function down(): Promise<void> {}
