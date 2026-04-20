import { Order } from "@/classes/order";
import { LoaderFactory } from "@/dataloader/loader-factory";
import { table_restaurant_tables } from "@/generated/tables";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

interface table_with_order extends table_restaurant_tables {
  order: Order;
}

export const tableById = withAuthApi<
  { id: string },
  unknown,
  ResponseType<table_with_order>
>(
  async ({ db, userAuth, params }) => {
    const item = await db
      .table("restaurant_tables")
      .where({
        deleted_at: null,
        warehouse_id: userAuth.admin
          ? userAuth.admin?.currentWarehouseId || ""
          : userAuth.customer?.warehouseId,
        id: params?.id,
      })
      .first();

    const order = await db
      .table("customer_order")
      .where({ order_status: "DRAFT", table_number: item?.id })
      .first();

    const orderLoader = LoaderFactory.orderLoader(db);

    const row = {
      ...item,
      order: order ? await orderLoader.load(order.order_id) : null,
    };

    return NextResponse.json(
      {
        success: true,
        result: {
          ...row,
          order: row.order
            ? {
                ...row.order,
                orderId: row.order ? row.order.order_id! : null,
                invoiceNo: row.order ? row.order.invoice_no : null,
                customerId: row.order ? row.order.customer_id : null,
                orderStatus: row.order ? row.order.order_status : null,
                createdAt: row.order ? row.order.created_at : null,
                createdBy: row.order ? row.order.created_by : null,
                totalAmount: row.order ? row.order.total_amount : null,
                transferBy: row.order ? row.order.transfer_by : null,
                transferAt: row.order ? row.order.transfer_at : null,
              }
            : null,
        },
      },
      { status: 200 }
    );
  },
  ["CUSTOMER", "ADMIN"]
);
