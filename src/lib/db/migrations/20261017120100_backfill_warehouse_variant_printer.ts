import type { Knex } from "knex";

/**
 * Copy each branch's category printer onto every live variant of the products
 * in that category. INSERT IGNORE keeps existing variant bindings, and when a
 * product sits in several printer-bound categories the first one inserted wins.
 */
export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    INSERT IGNORE INTO warehouse_variant_printer (warehouse_id, variant_id, printer_id)
    SELECT wcp.warehouse_id, pv.id, wcp.printer_id
    FROM warehouse_category_printer wcp
    INNER JOIN product_categories pc ON pc.category_id = wcp.category_id
    INNER JOIN product_variant pv ON pv.product_id = pc.product_id
    WHERE pv.deleted_at IS NULL
      AND wcp.printer_id IS NOT NULL
      AND wcp.printer_id <> ''
  `);
}

// Backfilled rows can't be told apart from ones set later in the product form.
export async function down(): Promise<void> {}
