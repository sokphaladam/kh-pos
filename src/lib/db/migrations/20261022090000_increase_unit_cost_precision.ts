import type { Knex } from "knex";

// Unit costs were decimal(10,2), so per-gram / per-ml stock items lost their
// cost (0.0068 per g was stored as 0.01). Six decimals keeps recipe costing
// and stock valuation exact; ten integer digits still fit KHR amounts.
// MODIFY rewrites the whole column definition, so comments are carried over.
const UNIT_COST_COLUMNS: {
  table: string;
  column: string;
  nullable: boolean;
  comment?: string;
}[] = [
  {
    table: "product_lot",
    column: "cost_per_unit",
    nullable: true,
    comment: "cost of the product per unit",
  },
  { table: "product_variant", column: "purchased_cost", nullable: false },
  { table: "replenishment_items", column: "cost", nullable: true },
  { table: "supplier_product_prices", column: "price", nullable: false },
  {
    table: "supplier_product_prices",
    column: "scheduled_price",
    nullable: true,
  },
  {
    table: "schedule_supplier_product_prices",
    column: "price",
    nullable: false,
  },
  {
    table: "supplier_purchase_order_detail",
    column: "purchased_cost",
    nullable: false,
  },
];

async function setPrecision(knex: Knex, precision: number, scale: number) {
  for (const { table, column, nullable, comment } of UNIT_COST_COLUMNS) {
    await knex.schema.alterTable(table, (t) => {
      const col = t.decimal(column, precision, scale);
      if (comment) col.comment(comment);
      if (nullable) col.nullable().alter();
      else col.notNullable().alter();
    });
  }
}

export async function up(knex: Knex): Promise<void> {
  await setPrecision(knex, 16, 6);
}

// Rounds every unit cost back to 2 decimals.
export async function down(knex: Knex): Promise<void> {
  await setPrecision(knex, 10, 2);
}
