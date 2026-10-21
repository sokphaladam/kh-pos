import type { Knex } from "knex";

// Stock count sessions: what was physically counted in a slot on a date, the
// system qty at that moment and the adjustment made. Closing counts are the
// "actual" side of the standard-vs-actual variance report.
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("product_variant", (table) => {
    table
      .enum("count_frequency", ["DAILY", "WEEKLY", "MONTHLY"])
      .nullable()
      .comment("How often to count this item; NULL = monthly");
  });

  await knex.schema.createTable("stock_count", (table) => {
    table.string("id", 36).primary();
    table.string("warehouse_id", 36).notNullable();
    table.string("slot_id", 36).notNullable();
    table.date("count_date").notNullable();
    table.text("note").nullable();
    table.string("created_by", 36).nullable();
    table.datetime("created_at").notNullable();

    table.index(["warehouse_id", "count_date"], "idx_stock_count_wh_date");
  });

  await knex.schema.createTable("stock_count_item", (table) => {
    table.string("id", 36).primary();
    table.string("count_id", 36).notNullable();
    table.string("variant_id", 36).notNullable();
    table.integer("system_qty").notNullable();
    table.integer("counted_qty").notNullable();
    table.integer("diff_qty").notNullable();
    table
      .decimal("unit_cost", 16, 6)
      .notNullable()
      .defaultTo(0)
      .comment("Average lot cost in the slot at count time");
    table.decimal("diff_amount", 16, 6).notNullable().defaultTo(0);

    table.index("count_id", "idx_stock_count_item_count");
    table.index("variant_id", "idx_stock_count_item_variant");
  });

  await knex.schema.createTable("stock_count_transaction", (table) => {
    table.string("count_id", 36).notNullable();
    table.string("transaction_id", 36).notNullable();
    table.primary(["count_id", "transaction_id"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("stock_count_transaction");
  await knex.schema.dropTableIfExists("stock_count_item");
  await knex.schema.dropTableIfExists("stock_count");
  await knex.schema.alterTable("product_variant", (table) => {
    table.dropColumn("count_frequency");
  });
}
