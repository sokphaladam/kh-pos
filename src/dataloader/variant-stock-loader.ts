import DataLoader from "dataloader";
import { Knex } from "knex";

export interface VariantStock {
  variantId: string;
  stock: number;
  slotStock: {
    slotId: string;
    slotName: string;
    posSlot: boolean;
    stock: number;
  }[];
}

export function createVariantStockLoader(
  db: Knex,
  warehouseId: string,
  forReplenishment?: boolean
) {
  return new DataLoader(async (keys: readonly string[]) => {
    const query = db
      .table("inventory")
      .innerJoin("warehouse_slot", "inventory.slot_id", "warehouse_slot.id")
      .where("warehouse_slot.warehouse_id", warehouseId)
      .whereIn("inventory.variant_id", keys)
      .select(
        db.raw(
          "variant_id, inventory.slot_id, slot_name, pos_slot , SUM(qty) as stock"
        )
      )
      .groupBy("variant_id")
      .groupBy("inventory.slot_id");

    if (forReplenishment) query.where("warehouse_slot.for_replenishment", 1);

    const rows = await query;

    return keys.map((key) => {
      const x = rows.filter((u) => u.variant_id === key);
      if (x.length === 0) return null;
      return {
        variantId: x[0].variant_id,
        stock: x.reduce((sum, row) => sum + (Number(row.stock) || 0), 0),
        slotStock: x.map((row) => ({
          slotId: row.slot_id,
          slotName: row.slot_name,
          posSlot: row.pos_slot === 1,
          stock: row.stock || 0,
        })),
      } as VariantStock;
    });
  });
}
