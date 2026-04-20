import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.table("producer_settlement", (table) => {
    table.renameColumn("showtime_id", "movie_id");
  });
}

export async function down(): Promise<void> {}
