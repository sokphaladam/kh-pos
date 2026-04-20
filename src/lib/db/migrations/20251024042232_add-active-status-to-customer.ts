import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.table("customer", (table) => {
    table.boolean("is_active").defaultTo(true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.table("customer", (table) => {
    table.dropColumn("is_active");
  });
}
