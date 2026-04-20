import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("customer", (table) => {
    table.string("email").unique().nullable();
    table.string("email_key").nullable().unique();
    table.string("photo").nullable();
  });
}

export async function down(): Promise<void> {}
