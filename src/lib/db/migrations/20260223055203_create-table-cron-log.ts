import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("cron_log", (table) => {
    table.increments("id").primary();
    table.string("job_name", 100).notNullable().index();
    table.timestamp("started_at").notNullable().index();
    table.timestamp("finished_at").nullable();
    table
      .integer("duration_ms")
      .nullable()
      .comment("Execution duration in milliseconds");
    table
      .enum("status", ["success", "failed", "skipped", "retrying"])
      .notNullable()
      .index();
    table.text("error_message").nullable();
    table.text("error_stack").nullable();
    table.integer("retry_count").notNullable().defaultTo(0);
    table
      .json("metadata")
      .nullable()
      .comment("Job-specific data like records processed");
    table.timestamp("created_at").defaultTo(knex.fn.now()).notNullable();

    // Indexes for common queries
    table.index(["job_name", "started_at"], "idx_cron_log_job_started");
    table.index(["status", "started_at"], "idx_cron_log_status_started");
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists("cron_log");
}
