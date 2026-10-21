import type { Knex } from "knex";

// The seed schema (src/lib/db/database.sql) already contains these columns
// and indexes, so on a fresh database only the missing ones are added.
export async function up(knex: Knex): Promise<void> {
  const has = (column: string) =>
    knex.schema.hasColumn("user_activity_logs", column);
  const [hasDevice, hasDeviceId, hasIp, hasAgent] = await Promise.all([
    has("device"),
    has("device_id"),
    has("ip_address"),
    has("user_agent"),
  ]);
  const [indexRows] = await knex.raw(
    `SELECT DISTINCT index_name AS name FROM information_schema.statistics
     WHERE table_schema = DATABASE() AND table_name = 'user_activity_logs'`,
  );
  const indexes = new Set(
    (indexRows as { name: string }[]).map((r) => r.name),
  );

  return knex.schema.alterTable("user_activity_logs", (table) => {
    if (!hasDevice)
      table
        .string("device", 255)
        .nullable()
        .comment("Human readable device name: user-set label, else parsed user-agent");
    if (!hasDeviceId)
      table
        .string("device_id", 64)
        .nullable()
        .comment("Stable per-browser device id from the client (localStorage)");
    if (!hasIp) table.string("ip_address", 45).nullable();
    if (!hasAgent) table.text("user_agent").nullable();

    if (!indexes.has("idx_ual_user_timestamp"))
      table.index(["user_id", "timestamp"], "idx_ual_user_timestamp");
    if (!indexes.has("idx_ual_key")) table.index("key", "idx_ual_key");
    if (!indexes.has("idx_ual_timestamp"))
      table.index("timestamp", "idx_ual_timestamp");
    if (!indexes.has("idx_ual_device"))
      table.index("device", "idx_ual_device");
    if (!indexes.has("idx_ual_device_id"))
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
