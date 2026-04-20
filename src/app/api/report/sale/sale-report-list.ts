import { table_customer_order_detail } from "@/generated/tables/table_customer_order_detail";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

export interface SaleReportItem extends table_customer_order_detail {
  warehouse_id: string;
  paid_at: string;
}

export const getSaleReport = withAuthApi<
  unknown,
  unknown,
  ResponseType<unknown>
>(async ({ db, req, userAuth }) => {
  const user = userAuth.admin!;
  const param = req.nextUrl.searchParams;
  const query = db
    .table("customer_order_detail")
    .innerJoin(
      "customer_order",
      "customer_order.order_id",
      "customer_order_detail.order_id"
    )
    .where({ "customer_order.order_status": "COMPLETED" });
  const startDate = String(param.get("startDate") || "");
  const endDate = String(param.get("endDate") || "");
  const warehouseId = user.currentWarehouseId;

  if (startDate && endDate) {
    query.whereBetween("customer_order.paid_at", [startDate, endDate]);
  }

  if (warehouseId) {
    query
      .innerJoin("user", "user.id", "customer_order_detail.created_by")
      .where("user.warehouse_id", warehouseId);
  }

  const items = await query
    .clone()
    .select("customer_order_detail.*", "user.warehouse_id")
    .select(
      db.raw("DATE_FORMAT(customer_order.paid_at, '%Y-%m-%d') as paid_at")
    )
    .orderBy("customer_order.paid_at", "asc");

  return NextResponse.json(
    { success: true, result: items, error: "" },
    { status: 200 }
  );
});
