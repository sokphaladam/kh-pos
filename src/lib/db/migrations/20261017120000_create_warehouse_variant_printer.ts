import type { Knex } from "knex";

/**
 * Kitchen printer per product variant, per branch (printer ids live in the
 * branch's PRINT_SERVER setting). Overrides the category's default printer in
 * `warehouse_category_printer`; see getPrinterInfo in src/classes/print-to-kitchen.ts.
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("warehouse_variant_printer", (table) => {
    table.string("warehouse_id").notNullable();
    table.string("variant_id").notNullable();
    table.string("printer_id").notNullable();
    table.primary(["warehouse_id", "variant_id"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("warehouse_variant_printer");
}
