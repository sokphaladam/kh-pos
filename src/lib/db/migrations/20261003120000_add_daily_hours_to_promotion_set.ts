import type { Knex } from "knex";

/** Daily "happy hour" window for promotion sets (see src/lib/promotion-set.ts). */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("promotion_set", (table) => {
    table
      .time("daily_start_time")
      .nullable()
      .comment("happy hour start (inclusive); null = all day");
    table
      .time("daily_end_time")
      .nullable()
      .comment("happy hour end (exclusive); before start = crosses midnight");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("promotion_set", (table) => {
    table.dropColumn("daily_start_time");
    table.dropColumn("daily_end_time");
  });
}
