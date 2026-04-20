import { table_order_detail_modifier } from "@/generated/tables";
import DataLoader from "dataloader";
import { Knex } from "knex";

export interface OrderModifierType {
  orderDetailId: string;
  modifierItemId: string;
  price?: number;
  notes?: string;
}

export function createOrderModifierLoader(db: Knex) {
  return new DataLoader(async (keys: readonly string[]) => {
    const rows: table_order_detail_modifier[] =
      await db<table_order_detail_modifier>("order_detail_modifier")
        .whereIn("order_detail_id", keys)
        .select("*");
    const orderModifiers = rows.map((row) => ({
      orderDetailId: row.order_detail_id,
      modifierItemId: row.modifier_item_id,
      price: row.price ? Number(row.price) : undefined,
      notes: row.notes ?? undefined,
    }));
    const modifierMap = new Map<string, OrderModifierType[]>();
    orderModifiers.forEach((modifier) => {
      if (!modifierMap.has(modifier.orderDetailId)) {
        modifierMap.set(modifier.orderDetailId, []);
      }
      modifierMap.get(modifier.orderDetailId)!.push(modifier);
    });
    return keys.map((key) => modifierMap.get(key));
  });
}
