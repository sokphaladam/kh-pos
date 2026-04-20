import { KitchenLog } from "@/classes/order";
import { Formatter } from "@/lib/formatter";
import DataLoader from "dataloader";
import { Knex } from "knex";

export function createKitchenLogByOrderDetailLoader(db: Knex) {
  return new DataLoader(async (keys: readonly string[]) => {
    const rows = await db
      .table("print_kitchen_log")
      .whereIn("order_detail_id", keys);

    const logMap: Record<string, KitchenLog[]> = {};

    await Promise.all(
      rows.map(async (x) => {
        if (!logMap[x.order_detail_id!]) {
          logMap[x.order_detail_id!] = [];
        }
        logMap[x.order_detail_id!].push({
          orderId: x.order_id,
          orderDetailId: x.order_detail_id,
          itemPrice: x.item_price,
          printedAt: Formatter.dateTime(x.printed_at),
        });
      }),
    );

    return keys.map((key) => logMap[key] || []);
  });
}
