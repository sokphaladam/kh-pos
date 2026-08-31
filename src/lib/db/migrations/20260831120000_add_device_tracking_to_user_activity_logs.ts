import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("user_activity_logs", (table) => {
    table
      .string("device", 255)
      .nullable()
      .comment("Human readable device name: user-set label, else parsed user-agent");
    table
      .string("device_id", 64)
      .nullable()
      .comment("Stable per-browser device id from the client (localStorage)");
    table.string("ip_address", 45).nullable();
    table.text("user_agent").nullable();

    table.index(["user_id", "timestamp"], "idx_ual_user_timestamp");
    table.index("key", "idx_ual_key");
    table.index("timestamp", "idx_ual_timestamp");
    table.index("device", "idx_ual_device");
    table.index("device_id", "idx_ual_device_id");
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("user_activity_logs", (table) => {
    table.dropIndex(["user_id", "timestamp"], "idx_ual_user_timestamp");
    table.dropIndex("key", "idx_ual_key");
    table.dropIndex("timestamp", "idx_ual_timestamp");
    table.dropIndex("device", "idx_ual_device");
    table.dropIndex("device_id", "idx_ual_device_id");

    table.dropColumn("device");
    table.dropColumn("device_id");
    table.dropColumn("ip_address");
    table.dropColumn("user_agent");
  });
}
