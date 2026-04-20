import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("customer_token", (table) => {
    table.increments("id").primary();
    table.string("customer_id").notNullable();
    table.string("device_id").notNullable();
    table.string("token").notNullable();
    table.timestamp("created_at").notNullable();
    table.timestamp("expires_at").notNullable();
    table.boolean("is_revoked").notNullable().defaultTo(false);
    table.jsonb("metadata").nullable();
    table.enum("platform", ["ios", "android", "web"]).defaultTo("web");
    table.enum("token_type", ["walk-in", "online"]).defaultTo("online");
  });

  // indexing
  await knex.schema.raw(`
      CREATE INDEX idx_customer_token_customer_token ON customer_token (token);
    `);
}

export async function down(): Promise<void> {}
