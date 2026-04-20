import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("movie", (table) => {
    table.uuid("movie_id").primary().comment("It is the same as variant_id");
    table.integer("duration_minutes").notNullable();
    table
      .string("rating")
      .notNullable()
      .comment("e.g., G, PG, PG-13, R, NC-17");
    table.jsonb("genre").nullable().comment("e.g., Action, Comedy, Drama");
    table.date("release_date").notNullable();
    table.string("poster_url").nullable();
    table.string("trailer_url").nullable();
    table.string("director").nullable().comment("Name of the director");
    table.jsonb("cast").nullable().comment("List of main actors/actresses");
    table
      .text("synopsis")
      .nullable()
      .comment("Brief summary of the movie plot");
    table.uuid("created_by");
    table.datetime("created_at");
    table.datetime("updated_at");
    table.datetime("deleted_at");
  });

  // Add indexes
  await knex.schema.raw(`
    CREATE INDEX idx_movie_release_date ON movie (release_date);
  `);
  await knex.schema.raw(`
    CREATE INDEX idx_movie_deleted_at ON movie (deleted_at);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("movie");
}
