import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("producer_settlement", (table) => {
    table.uuid("id").primary();
    table.string("showtime_id");
    table.decimal("total_amount", 10, 2).defaultTo(0);
    table.decimal("share_amount", 10, 2).defaultTo(0);
    table.dateTime("created_at").defaultTo(knex.fn.now());
    table.string("created_by");
    table.dateTime("settled_at").nullable().defaultTo(null);
    table.string("settled_by").nullable().defaultTo(null);
    table.string("proof_link").nullable();
  });
}

export async function down(): Promise<void> {}
