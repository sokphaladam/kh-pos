import { Customer } from "@/classes/customer";
import { table_customer } from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import DataLoader from "dataloader";
import { Knex } from "knex";
import { LoaderFactory } from "./loader-factory";

export function createCustomerLoader(db: Knex) {
  return new DataLoader(async (keys: readonly string[]) => {
    const rows = await db
      .table<table_customer>("customer")
      .whereIn("id", keys as string[]);

    const userLoader = LoaderFactory.userLoader(db);
    const warehouseLoader = LoaderFactory.warehouseLoader(db);

    return keys.map((key) => {
      const row = rows.find((r) => r.id === key);

      if (!row) return null;

      return {
        id: row.id,
        customerName: row.customer_name,
        phone: row.phone,
        address: row.address,
        createdAt: Formatter.dateTime(row.created_at)!,
        createdBy: row.created_by ? userLoader.load(row.created_by) : null,
        type: row.customer_type || "general",
        extraPrice: row.extra_price,
        warehouse: row.pos_warehouse_id
          ? warehouseLoader.load(row.pos_warehouse_id)
          : null,
      } as Customer;
    });
  });
}
