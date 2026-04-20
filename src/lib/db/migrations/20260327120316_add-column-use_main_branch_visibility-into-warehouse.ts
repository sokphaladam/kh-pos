import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("warehouse", (table) => {
    table.boolean("use_main_branch_visibility").defaultTo(false);
  });
}

export async function down(): Promise<void> {}
