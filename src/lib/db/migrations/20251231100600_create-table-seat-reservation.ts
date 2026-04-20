import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("seat_reservation", (table) => {
    table.uuid("reservation_id").primary();
    table.uuid("showtime_id").notNullable();
    table.uuid("seat_id").notNullable();
    table.uuid("order_detail_id").nullable();
    table
      .enum("reservation_status", [
        "pending",
        "confirmed",
        "admitted",
        "cancelled",
        "expired",
      ])
      .notNullable()
      .defaultTo("confirmed");
    table.datetime("created_at");
    table.datetime("updated_at");
    table.uuid("created_by");
    table.uuid("confirmed_by").nullable();
    table.datetime("confirmed_at").nullable();
    table.uuid("admitted_by").nullable();
    table.datetime("admitted_at").nullable();
  });

  // Add indexes and unique constraint
  await knex.schema.raw(`
    CREATE INDEX idx_seat_reservation_showtime_id ON seat_reservation (showtime_id);
  `);
  await knex.schema.raw(`
    CREATE INDEX idx_seat_reservation_seat_id ON seat_reservation (seat_id);
  `);
  await knex.schema.raw(`
    CREATE INDEX idx_seat_reservation_order_detail_id ON seat_reservation (order_detail_id);
  `);
  await knex.schema.raw(`
    CREATE INDEX idx_seat_reservation_status ON seat_reservation (reservation_status);
  `);
  await knex.schema.raw(`
    CREATE UNIQUE INDEX idx_seat_reservation_unique_active ON seat_reservation (showtime_id, seat_id);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("seat_reservation");
}
