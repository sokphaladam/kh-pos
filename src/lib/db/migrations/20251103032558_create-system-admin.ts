import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.table("user", async (table) => {
    table.boolean("is_system_admin").notNullable().defaultTo(false);
  });
}

export async function down(): Promise<void> {}
