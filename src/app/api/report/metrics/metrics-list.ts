import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

export const metricsList = withAuthApi<unknown, unknown, ResponseType<unknown>>(
  async ({ db, userAuth, req }) => {
    const user = userAuth.admin!;
    const param = req.nextUrl.searchParams;
    const startDate = String(param.get("startDate") || "");
    const endDate = String(param.get("endDate") || "");

    const allOrdersSubquery = db("customer_order_detail")
      .select(["customer_order_detail.*", "customer_order.paid_at"])
      .innerJoin(
        "customer_order",
        "customer_order_detail.order_id",
        "customer_order.order_id"
      )
      .where("customer_order.warehouse_id", user.currentWarehouseId)
      .where({ "customer_order.order_status": "COMPLETED" });

    if (startDate && endDate) {
      allOrdersSubquery.whereBetween("customer_order.paid_at", [
        startDate,
        endDate,
      ]);
    }

    const mainQuery = await db
      .with("all_orders", allOrdersSubquery)
      .from("all_orders")
      .select([
        "all_orders.order_detail_id",
        "all_orders.total_amount",
        db.raw("-coalesce(??, 0) * coalesce(??, 0) as cost", [
          "inventory_transactions.qty",
          "product_lot.cost_per_unit",
        ]),
        db.raw("?? + (coalesce(??, 0) * coalesce(??, 0)) as total_with_cost", [
          "all_orders.total_amount",
          "inventory_transactions.qty",
          "product_lot.cost_per_unit",
        ]),
        db.raw("DATE_FORMAT(all_orders.paid_at, '%Y-%m-%d') as paid_at"),
      ])
      .leftJoin(
        "fulfilment_detail",
        "all_orders.order_detail_id",
        "fulfilment_detail.order_detail_id"
      )
      .leftJoin(
        "inventory_transactions",
        "inventory_transactions.id",
        "fulfilment_detail.transaction_id"
      )
      .leftJoin(
        "product_lot",
        "product_lot.id",
        "inventory_transactions.lot_id"
      );

    const items = mainQuery.map((x) => {
      return {
        date: x.paid_at,
        orderDetailId: x.order_detail_id,
        sale: x.total_amount,
        cost: x.cost,
        profit: x.total_with_cost,
      };
    });

    return NextResponse.json(
      { success: true, result: items, error: "" },
      { status: 200 }
    );
  }
);
