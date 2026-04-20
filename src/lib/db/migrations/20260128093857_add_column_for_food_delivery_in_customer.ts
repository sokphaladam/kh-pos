import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return await knex.schema.alterTable("customer", (table) => {
    table
      .enum("customer_type", ["general", "delivery"])
      .notNullable()
      .defaultTo("general");
    table.decimal("extra_price").nullable().defaultTo(0);
  });
}

export async function down(): Promise<void> {}
