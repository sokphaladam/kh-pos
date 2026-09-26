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
    const slotQuery = db
      .table("warehouse_slot")
      .where("warehouse_id", warehouseId);
    if (forReplenishment) slotQuery.where("for_replenishment", 1);

    const [slots, stockRows] = await Promise.all([
      slotQuery.clone().select("id", "slot_name", "pos_slot"),
      db
        .table("inventory")
        .whereIn("variant_id", keys)
        .whereIn("slot_id", slotQuery.clone().select("id"))
        .select("variant_id", "slot_id", db.raw("SUM(qty) as stock"))
        .groupBy("variant_id", "slot_id"),
    ]);

    const slotById = new Map(slots.map((s) => [s.id, s]));
    const rows = stockRows.map((row) => ({
      ...row,
      slot_name: slotById.get(row.slot_id)?.slot_name,
      pos_slot: slotById.get(row.slot_id)?.pos_slot,
    }));

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
