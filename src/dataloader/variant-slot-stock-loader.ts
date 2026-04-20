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
      .innerJoin("warehouse_slot", "inventory.slot_id", "warehouse_slot.id")
      .where("warehouse_slot.warehouse_id", warehouseId)
      .whereIn("inventory.variant_id", variantIds)
      .whereIn("inventory.slot_id", slotIds)
      .select(db.raw("inventory.variant_id, inventory.slot_id, SUM(qty) as stock"))
      .groupBy("inventory.variant_id").groupBy("inventory.slot_id");


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
