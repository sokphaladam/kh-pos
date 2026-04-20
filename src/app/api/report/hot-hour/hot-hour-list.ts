import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

export const getHotHour = withAuthApi<
  unknown,
  unknown,
  ResponseType<unknown[]>,
  { startDate?: string; endDate?: string }
>(async ({ db, searchParams, userAuth }) => {
  const query = db
    .table("customer_order")
    .innerJoin(
      "customer_order_detail",
      "customer_order_detail.order_id",
      "customer_order.order_id"
    )
    .whereNotNull("customer_order.paid_at");

  if (searchParams?.startDate && searchParams?.endDate) {
    query.whereBetween("customer_order.paid_at", [
      searchParams.startDate,
      searchParams.endDate,
    ]);
  }

  if (userAuth.admin) {
    query.where(
      "customer_order.warehouse_id",
      userAuth.admin.currentWarehouseId
    );
  }

  const result = await query
    .clone()
    .select(
      db.raw("WEEKDAY(customer_order.paid_at) as week_of_day"),
      db.raw("HOUR(customer_order.paid_at) as hore_of_week"),
      db.raw("SUM(customer_order_detail.qty) as total_qty"),
      db.raw("SUM(customer_order_detail.total_amount) as total_amount")
    )
    .groupByRaw("WEEKDAY(customer_order.paid_at), HOUR(customer_order.paid_at)")
    .orderByRaw(
      "WEEKDAY(customer_order.paid_at), HOUR(customer_order.paid_at)"
    );

  return NextResponse.json(
    {
      success: true,
      result: result.map((x) => {
        return {
          ...x,
          total_qty: Number(x.total_qty),
          total_amount: Number(x.total_amount),
        };
      }),
      error: "",
    },
    { status: 200 }
  );
});
