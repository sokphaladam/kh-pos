import DataLoader from "dataloader";
import { Knex } from "knex";

export interface VariantSlotStock {
  variantId: string;
  slotId: string;
  stock: number;
}

export function createVariantSlotStockLoader(
  db: Knex,
  warehouseId: string,
) {
  return new DataLoader(async (keys: readonly string[]) => {
    // key = variantId_slotId
    const variantIds = keys.map((key) => key.split("_")[0]);
    const slotIds = keys.map((key) => key.split("_")[1]);
    const query = db
      .table("inventory")
      .whereIn("variant_id", variantIds)
      .whereIn("slot_id", slotIds)
      .whereIn(
        "slot_id",
        db.table("warehouse_slot").where("warehouse_id", warehouseId).select("id"),
      )
      .select("variant_id", "slot_id", db.raw("SUM(qty) as stock"))
      .groupBy("variant_id", "slot_id");


    const rows = await query;

    return keys.map((key) => {
      const x = rows.find((u) => u.variant_id === key.split("_")[0] && u.slot_id === key.split("_")[1]);
      if (!x) return null;
      return {
        variantId: x.variant_id,
        slotId: x.slot_id,
        stock: Number(x.stock | 0),
      } as VariantSlotStock;
    });
  });
}
