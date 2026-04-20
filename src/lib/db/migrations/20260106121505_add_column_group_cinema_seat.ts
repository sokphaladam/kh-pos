import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("cinema_seat", (table) => {
    table
      .string("group_id")
      .nullable()
      .comment("only have value when seat type is couple.");
  });
}

export async function down(): Promise<void> {}
