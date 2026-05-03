import { table_order_item_status } from "@/generated/tables";
import DataLoader from "dataloader";
import { Knex } from "knex";
import { LoaderFactory } from "./loader-factory";
import { Formatter } from "@/lib/formatter";
import { UserInfo } from "@/lib/server-functions/get-auth-from-token";

export interface OrderItemStatusType {
  orderItemId: string;
  status: table_order_item_status["status"];
  qty: number;
  createdBy?: UserInfo | null;
  createdAt?: string | undefined | null;
}

export function createOrderStatusItemLoader(
  db: Knex,
): DataLoader<string, OrderItemStatusType[]> {
  return new DataLoader<string, OrderItemStatusType[]>(
    async (keys: readonly string[]) => {
      const rows = await db
        .table<table_order_item_status>("order_item_status")
        .whereIn("order_item_id", keys);

      const userLoader = LoaderFactory.userLoader(db);

      return Promise.all(
        keys.map((key) => {
          return Promise.all(
            rows
              .filter((f) => f.order_item_id === key)
              .map(async (row) => ({
                orderItemId: row.order_item_id,
                status: row.status,
                qty: Number(row.qty || 0),
                createdBy: row.created_by
                  ? await userLoader.load(row.created_by)
                  : null,
                createdAt: row.created_at
                  ? Formatter.dateTime(row.created_at)
                  : null,
              })),
          );
        }),
      );
    },
  );
}
