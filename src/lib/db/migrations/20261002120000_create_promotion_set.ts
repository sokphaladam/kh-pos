import type { Knex } from "knex";

/**
 * Promotion sets ("combo" / bundle promotions such as "6+2: buy 6 beers, get
 * 2 beers + 1 meat free"). The math lives in src/lib/promotion-set.ts; the
 * order engine writes the result as `discount_log` rows with
 * `discount_id = "promo:<promotion_set.id>"`.
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("promotion_set", (table) => {
    table.string("id", 50).primary();
    table.string("warehouse_id", 50).nullable().index();
    table.string("title", 255).notNullable();
    table.text("description").nullable();
    table.boolean("is_active").notNullable().defaultTo(true);
    table.dateTime("start_at").nullable();
    table.dateTime("end_at").nullable();
    table
      .integer("max_apply_per_order")
      .nullable()
      .comment("times the set may apply on one order; null = unlimited");
    table
      .integer("priority")
      .notNullable()
      .defaultTo(0)
      .comment("higher priority sets claim order units first");
    table.dateTime("created_at").nullable();
    table.string("created_by", 50).nullable();
    table.dateTime("updated_at").nullable();
    table.string("updated_by", 50).nullable();
    table.dateTime("deleted_at").nullable();
  });

  await knex.schema.createTable("promotion_set_item", (table) => {
    table.string("id", 50).primary();
    table.string("promotion_set_id", 50).notNullable().index();
    table
      .enum("match_type", ["VARIANT", "PRODUCT", "CATEGORY"])
      .notNullable()
      .defaultTo("VARIANT");
    table.string("match_id", 50).notNullable();
    table.integer("qty").notNullable().defaultTo(1);
    table
      .enum("discount_type", ["PERCENTAGE", "AMOUNT"])
      .notNullable()
      .defaultTo("PERCENTAGE");
    table
      .decimal("discount_value", 12, 2)
      .notNullable()
      .defaultTo(0)
      .comment("0 = condition slot (full price)");
    table.integer("sort_order").notNullable().defaultTo(0);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("promotion_set_item");
  await knex.schema.dropTableIfExists("promotion_set");
}
