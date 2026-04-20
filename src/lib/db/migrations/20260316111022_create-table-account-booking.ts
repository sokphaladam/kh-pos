import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("account_booking", (table) => {
    table.uuid("id").primary();
    table.uuid("account_id").notNullable();
    table.decimal("amount", 10, 2).defaultTo(0);
    table.dateTime("created_at").defaultTo(knex.fn.now());
    table.string("created_by").notNullable();
    table.string("description");
    table.dateTime("deleted_at");
    table.string("deleted_by");
  });
}

export async function down(): Promise<void> {}
