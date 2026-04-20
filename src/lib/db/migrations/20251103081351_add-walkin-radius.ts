import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.table("warehouse", async (table) => {
    table.integer("walkin_radius_in_meters").notNullable().defaultTo(100);
  });
}

export async function down(): Promise<void> {}
