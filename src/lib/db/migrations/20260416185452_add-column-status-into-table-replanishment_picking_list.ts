import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("replenishment_picking_list", (table) => {
    table.string("status").notNullable().defaultTo("pending");
  });
}

export async function down(): Promise<void> {}
