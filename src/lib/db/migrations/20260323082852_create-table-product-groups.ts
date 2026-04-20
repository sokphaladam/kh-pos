import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("product_groups", (table) => {
    table.uuid("group_id").primary();
    table.string("group_name").notNullable();
    table.text("description").nullable();
    table.dateTime("created_at").defaultTo(knex.fn.now()).notNullable();
    table.dateTime("updated_at").notNullable();
    table.string("created_by").notNullable();
    table.string("updated_by").notNullable();
    table.dateTime("deleted_at").nullable();
    table.string("deleted_by").nullable();
  });
}

export async function down(): Promise<void> {}
