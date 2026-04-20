import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("cinema_hall", (table) => {
    table.uuid("hall_id").primary();
    table.uuid("warehouse_id").notNullable();
    table.string("hall_name").notNullable();
    table.integer("hall_number").notNullable();
    table.integer("total_seats").notNullable().defaultTo(0);
    table.integer("rows").notNullable();
    table.integer("columns").notNullable();
    table.json("hall_features").nullable();
    table
      .enum("status", ["active", "maintenance", "inactive"])
      .notNullable()
      .defaultTo("active");
    table.uuid("created_by");
    table.datetime("created_at").notNullable();
    table.datetime("updated_at").notNullable();
    table.datetime("deleted_at").nullable();
  });

  // Add indexes
  await knex.schema.raw(`
    CREATE INDEX idx_cinema_hall_warehouse_id ON cinema_hall (warehouse_id);
  `);
  await knex.schema.raw(`
    CREATE INDEX idx_cinema_hall_status ON cinema_hall (status);
  `);
  await knex.schema.raw(`
    CREATE INDEX idx_cinema_hall_deleted_at ON cinema_hall (deleted_at);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("cinema_hall");
}
