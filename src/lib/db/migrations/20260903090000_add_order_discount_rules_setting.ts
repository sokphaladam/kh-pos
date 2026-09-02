import type { Knex } from "knex";

const OPTION = "ORDER_DISCOUNT_RULES";

const DEFAULT_VALUE = JSON.stringify({
  amountRule: {
    enabled: false,
    minAmount: 100,
    discountType: "PERCENTAGE",
    value: 0,
  },
  qtyRule: {
    enabled: false,
    minQty: 50,
    discountType: "PERCENTAGE",
    value: 0,
  },
  maxQtyPerLine: { enabled: true, value: 3 },
});

/**
 * Backfill the per-warehouse `ORDER_DISCOUNT_RULES` setting (order-over-$X,
 * order-over-N-items, and the variant discount max-qty-per-line cap) so it
 * shows up in Settings for warehouses created before the feature.
 */
export async function up(knex: Knex): Promise<void> {
  const warehouses = await knex
    .table("warehouse")
    .where((qb) => qb.whereNull("is_deleted").orWhere("is_deleted", 0))
    .select("id");

  const existing = await knex
    .table("setting")
    .where("option", OPTION)
    .select("warehouse");
  const have = new Set(existing.map((r: { warehouse: string | null }) => r.warehouse));

  const rows = warehouses
    .map((w: { id: string }) => w.id)
    .filter((id: string) => !have.has(id))
    .map((id: string) => ({
      option: OPTION,
      value: DEFAULT_VALUE,
      warehouse: id,
    }));

  if (rows.length > 0) {
    await knex.table("setting").insert(rows);
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.table("setting").where("option", OPTION).delete();
}
