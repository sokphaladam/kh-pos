import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("cinema_seat", (table) => {
    table.uuid("seat_id").primary();
    table.uuid("hall_id").notNullable();
    table.string("row_label").notNullable();
    table.integer("seat_number").notNullable();
    table
      .enum("seat_type", ["standard", "vip", "couple", "wheelchair", "blocked"])
      .notNullable()
      .defaultTo("standard");
    table.boolean("is_available").notNullable().defaultTo(true);
    table.datetime("created_at").notNullable();
    table.datetime("updated_at").notNullable();
    table.datetime("deleted_at").nullable();
  });

  // Add indexes
  await knex.schema.raw(`
    CREATE INDEX idx_cinema_seat_hall_id ON cinema_seat (hall_id);
  `);
  await knex.schema.raw(`
    CREATE INDEX idx_cinema_seat_type ON cinema_seat (seat_type);
  `);
  await knex.schema.raw(`
    CREATE INDEX idx_cinema_seat_available ON cinema_seat (is_available);
  `);
  await knex.schema.raw(`
    CREATE UNIQUE INDEX idx_cinema_seat_unique_position ON cinema_seat (hall_id, row_label, seat_number, deleted_at);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("cinema_seat");
}
