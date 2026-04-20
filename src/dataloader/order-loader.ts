import { table_customer_order } from "@/generated/tables";
import DataLoader from "dataloader";
import { Knex } from "knex";
import { LoaderFactory } from "./loader-factory";
import { Order } from "@/classes/order";

export function createOrderLoader(db: Knex) {
  return new DataLoader(async (keys: readonly string[]) => {
    const rows: table_customer_order[] = await db
      .table<table_customer_order>("customer_order")
      .whereIn("order_id", keys);

    const orderDetailLoader = LoaderFactory.orderDetailLoader(db, "");
    const customerLoader = LoaderFactory.customerLoader(db);

    return await Promise.all(
      keys.map(async (key) => {
        const row = rows.find((f) => f.order_id === key);
        if (!row) return null;
        return {
          ...row,
          customer: row.customer,
          customerLoader: row.customer_id
            ? await customerLoader.load(row.customer_id)
            : null,
          items: row.order_id
            ? await orderDetailLoader.load(row.order_id)
            : null,
        };
      }),
    );
  });
}

export function createOrderLoaderByCustomerId(db: Knex) {
  return new DataLoader(async (keys: readonly string[]) => {
    const rows: table_customer_order[] = await db
      .table<table_customer_order>("customer_order")
      .whereIn("customer_id", keys)
      .orderBy("created_at", "desc")
      .limit(10);

    const orderDetailLoader = LoaderFactory.orderDetailLoader(db, "");
    const userLoader = LoaderFactory.userLoader(db);

    return await Promise.all(
      keys.map(async (key) => {
        const row = rows.filter((f) => f.customer_id === key);
        if (!row || row.length === 0) return null;
        return await Promise.all(
          row.map(async (r) => {
            return {
              invoiceNo: r.invoice_no || 0,
              orderId: r.order_id,
              orderStatus: r.order_status || "",
              createdAt: r.created_at,
              paidAt: r.paid_at,
              totalAmount: r.total_amount || "0",
              createdBy: r.created_by
                ? await userLoader.load(r.created_by)
                : null,
              customerId: r.customer_id,
              customerLoader: r.customer_id
                ? await LoaderFactory.customerLoader(db).load(r.customer_id)
                : null,
              customer: r.customer,
              printCount: r.print_time || 0,
              tableName: r.table_number || "",
              tableNumber: r.table_number || "",
              transferAt: r.transfer_at,
              servedType: r.served_type,
              deliveryCode: r.delivery_code,
              transferBy: r.transfer_by
                ? await userLoader.load(r.transfer_by)
                : null,
              items: r.order_id
                ? await orderDetailLoader.load(r.order_id)
                : null,
            } as Order;
          }),
        );
      }),
    );
  });
}
