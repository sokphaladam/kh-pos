import { table_order_item_status } from "@/generated/tables";
import DataLoader from "dataloader";
import { Knex } from "knex";

export interface OrderItemStatusType {
  orderItemId: string;
  status: table_order_item_status["status"];
  qty: number;
}

export function createOrderStatusItemLoader(
  db: Knex
): DataLoader<string, OrderItemStatusType[]> {
  return new DataLoader(async (keys: readonly string[]) => {
    const rows = await db
      .table<table_order_item_status>("order_item_status")
      .whereIn("order_item_id", keys);

    return keys.map((key) => {
      return rows
        .filter((f) => f.order_item_id === key)
        .map((row) => ({
          orderItemId: row.order_item_id,
          status: row.status,
          qty: Number(row.qty || 0),
        }));
    });
  });
}
