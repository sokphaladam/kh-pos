import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("bind_user", (table) => {
    table.increments("id").primary();
    table.string("user_id");
    table.integer("group");
    table.boolean("is_main_user").defaultTo(false);
  });
}

export async function down(): Promise<void> {}
