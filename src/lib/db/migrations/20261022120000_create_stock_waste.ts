import type { Knex } from "knex";

// Waste log: stock that leaves without a sale (spoiled, burnt, staff meal,
// comp, ...). The stock movement itself is an inventory_transactions DAMAGE
// row, linked through stock_waste_transaction.
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("stock_waste", (table) => {
    table.string("id", 36).primary();
    table.string("warehouse_id", 36).notNullable();
    table.string("variant_id", 36).notNullable();
    table.string("slot_id", 36).notNullable();
    table.integer("qty").notNullable();
    table.string("reason", 50).notNullable();
    table
      .enum("waste_type", ["WASTE", "NON_SALE"])
      .notNullable()
      .comment("NON_SALE = staff meal, comp, tasting: not counted as waste");
    table
      .decimal("cost_amount", 16, 6)
      .notNullable()
      .defaultTo(0)
      .comment("Cost of the stock taken out, from the lots deducted");
    table.text("note").nullable();
    table.string("created_by", 36).nullable();
    table.datetime("created_at").notNullable();

    table.index(["warehouse_id", "created_at"], "idx_stock_waste_wh_created");
    table.index("variant_id", "idx_stock_waste_variant");
  });

  await knex.schema.createTable("stock_waste_transaction", (table) => {
    table.string("waste_id", 36).notNullable();
    table.string("transaction_id", 36).notNullable();
    table.primary(["waste_id", "transaction_id"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("stock_waste_transaction");
  await knex.schema.dropTableIfExists("stock_waste");
}
