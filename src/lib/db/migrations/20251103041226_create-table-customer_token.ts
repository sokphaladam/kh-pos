import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // 20251024032428_add-token-to-customer already created a first version of
  // this table (no id / device_id), so a fresh database failed here with
  // "table already exists". Replace that version; keep its rows aside if any.
  if (await knex.schema.hasTable("customer_token")) {
    if (await knex.schema.hasColumn("customer_token", "device_id")) return;
    const [{ n }] = await knex("customer_token").count({ n: "*" });
    if (Number(n) > 0) {
      await knex.schema.renameTable("customer_token", "customer_token_legacy");
    } else {
      await knex.schema.dropTable("customer_token");
    }
  }

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
