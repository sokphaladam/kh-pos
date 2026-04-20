import { OrderReturn, OrderReturnService } from "@/classes/order-return";
import { table_order_return } from "@/generated/tables";
import DataLoader from "dataloader";
import { Knex } from "knex";

export function createOrderReturnByOrderDetailLoader(
  db: Knex
): DataLoader<string, OrderReturn[]> {
  return new DataLoader(async (keys: readonly string[]) => {
    const rows: table_order_return[] = await db("order_return")
      .whereIn("order_item_id", keys)
      .select("*");

    const results = await Promise.all(
      keys.map(async (key) => {
        const orderReturns = rows.filter((r) => r.order_item_id === key);
        return Promise.all(
          orderReturns.map((r) => OrderReturnService.map(r, db))
        );
      })
    );
    return results;
  });
}
