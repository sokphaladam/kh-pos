import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("warehouse_groups", (table) => {
    table.uuid("group_id");
    table.uuid("warehouse_id");
    table.primary(["group_id", "warehouse_id"]);
  });
}

export async function down(): Promise<void> {}
