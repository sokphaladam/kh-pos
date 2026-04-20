import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("customer_token", (table) => {
    table.string("customer_id").notNullable();
    table.string("token").notNullable().unique();
    table.datetime("created_at");
    table.primary(["customer_id", "token"]);
    table.jsonb("metadata").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("customer_token");
}
