import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("pricing_template", (table) => {
    table.uuid("template_id").primary();
    table.uuid("warehouse_id").notNullable();
    table
      .string("template_name")
      .notNullable()
      .comment("eg: Morning Showtimes, Weekend Special, Holiday Rates");
    table
      .enum("time_slot", ["matinee", "evening", "late_night", "all_day"])
      .notNullable();
    table
      .enum("day_type", ["weekday", "weekend", "holiday", "all_days"])
      .notNullable();
    table.jsonb("extra_seat_prices").comment("Additional price per seat type");
    table.uuid("created_by");
    table.datetime("created_at");
    table.datetime("updated_at");
    table.datetime("deleted_at");
  });

  // Add indexes
  await knex.schema.raw(`
    CREATE INDEX idx_pricing_template_warehouse_id ON pricing_template (warehouse_id);
  `);
  await knex.schema.raw(`
    CREATE INDEX idx_pricing_template_time_day ON pricing_template (time_slot, day_type);
  `);
  await knex.schema.raw(`
    CREATE INDEX idx_pricing_template_deleted_at ON pricing_template (deleted_at);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("pricing_template");
}
