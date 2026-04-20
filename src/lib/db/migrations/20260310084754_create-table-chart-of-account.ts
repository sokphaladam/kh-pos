import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("chart_of_account", (table) => {
    table.uuid("id").primary();
    table.string("account_name").notNullable();
    table.enum("account_type", ["revenue", "expense"]).notNullable();
    table.dateTime("created_at").defaultTo(knex.fn.now());
    table.string("created_by");
    table.dateTime("updated_at").defaultTo(knex.fn.now());
    table.string("updated_by");
  });
}

export async function down(): Promise<void> {}
