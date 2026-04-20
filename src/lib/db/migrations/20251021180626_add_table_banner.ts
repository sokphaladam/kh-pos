import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("banners", (table) => {
    table.increments("id").primary();
    table.string("image_url").notNullable();
    table.string("title");
    table.string("created_by");
    table.timestamp("created_at");
    table.timestamp("updated_at");
    table.string("updated_by");
    table.text("payload");
  });
}

export async function down(): Promise<void> {}
