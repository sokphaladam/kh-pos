import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("showtime", (table) => {
    table.uuid("showtime_id").primary();
    table.uuid("hall_id").notNullable();
    table.uuid("movie_id").notNullable();
    table.date("show_date").notNullable();
    table.datetime("start_time").notNullable();
    table.datetime("end_time").notNullable();
    table.uuid("pricing_template_id").nullable();
    table
      .enum("status", [
        "scheduled",
        "selling",
        "sold_out",
        "started",
        "ended",
        "cancelled",
      ])
      .notNullable()
      .defaultTo("scheduled");
    table.integer("available_seats").notNullable().defaultTo(0);
    table.integer("total_seats").notNullable().defaultTo(0);
    table
      .decimal("base_price", 10, 2)
      .comment(
        "Base price is from movie variant pricing, user always can edit it per showtime"
      )
      .notNullable();
    table.uuid("created_by");
    table.datetime("created_at");
    table.datetime("updated_at");
    table.datetime("deleted_at");
  });

  // Add indexes
  await knex.schema.raw(`
    CREATE INDEX idx_showtime_hall_id ON showtime (hall_id);
  `);
  await knex.schema.raw(`
    CREATE INDEX idx_showtime_movie_id ON showtime (movie_id);
  `);
  await knex.schema.raw(`
    CREATE INDEX idx_showtime_show_date ON showtime (show_date);
  `);
  await knex.schema.raw(`
    CREATE INDEX idx_showtime_start_time ON showtime (start_time);
  `);
  await knex.schema.raw(`
    CREATE INDEX idx_showtime_status ON showtime (status);
  `);
  await knex.schema.raw(`
    CREATE INDEX idx_showtime_deleted_at ON showtime (deleted_at);
  `);
  await knex.schema.raw(`
    CREATE INDEX idx_showtime_hall_date_time ON showtime (hall_id, show_date, start_time);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("showtime");
}
