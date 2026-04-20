import { Order } from "@/classes/order";
import { LoaderFactory } from "@/dataloader/loader-factory";
import { table_restaurant_tables } from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

interface table_with_order extends table_restaurant_tables {
  order: Order;
}

export const listTable = withAuthApi<
  unknown,
  unknown,
  ResponseType<table_with_order[]>
>(async ({ db, userAuth }) => {
  const items = await db
    .table("restaurant_tables")
    .where({
      deleted_at: null,
      warehouse_id: userAuth.admin!.currentWarehouseId,
    })
    .orderBy("created_at", "asc");

  const orders = await db
    .table("customer_order")
    .whereIn(
      "table_number",
      items.map((item) => item.id),
    )
    .where({ order_status: "DRAFT" });

  const orderLoader = LoaderFactory.orderLoader(db);

  const rows = await Promise.all(
    items.map(async (x) => {
      const order = orders.find((o) => o.table_number === x.id);
      return {
        ...x,
        order: order ? await orderLoader.load(order.order_id) : null,
      };
    }),
  );

  return NextResponse.json(
    {
      success: true,
      result: rows.map((x) => {
        return {
          ...x,
          order: x.order
            ? {
                ...x.order,
                orderId: x.order.order_id!,
                invoiceNo: x.order.invoice_no,
                customerId: x.order.customer_id,
                orderStatus: x.order.order_status,
                createdAt: x.order.created_at
                  ? Formatter.dateTime(x.order.created_at)
                  : null,
                createdBy: x.order.created_by,
                totalAmount: x.order.total_amount,
                transferBy: x.order.transfer_by,
                transferAt: x.order.transfer_at,
                customer: x.order.customer,
                printCount: x.order.print_time || 0,
                servedType: x.order.served_type,
                deliveryCode: x.order.delivery_code,
              }
            : null,
        };
      }),
    },
    { status: 200 },
  );
});
