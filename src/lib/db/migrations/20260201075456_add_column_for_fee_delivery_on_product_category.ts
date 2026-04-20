import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("product_category", (table) => {
    table.boolean("exclude_fee_delivery").notNullable().defaultTo(false);
    table.decimal("mark_extra_fee").notNullable().defaultTo(0);
  });
}

export async function down(): Promise<void> {}
