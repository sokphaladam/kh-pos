import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

export const GET = withAuthApi<
  unknown,
  unknown,
  ResponseType<
    {
      description: string;
      qty: number;
      discount_amount: number;
      total_amount: number;
    }[]
  >
>(async ({ db, userAuth, req }) => {
  const user = userAuth.admin!;
  const param = req.nextUrl.searchParams;
  const startDate = String(param.get("startDate") || "");
  const endDate = String(param.get("endDate") || "");
  const warehouseId = user.currentWarehouseId;

  const query = db
    .table("customer_order_detail")
    .select(
      db.raw(
        "CONCAT(product.title, ' (', product_variant.`name`, ')') AS description",
      ),
      db.raw("SUM(customer_order_detail.qty) AS qty"),
      db.raw("SUM(customer_order_detail.discount_amount) AS discount_amount"),
      db.raw(
        "SUM(customer_order_detail.qty * customer_order_detail.price - customer_order_detail.discount_amount) AS total_amount",
      ),
    )
    .innerJoin(
      "customer_order",
      "customer_order.order_id",
      "customer_order_detail.order_id",
    )
    .innerJoin(
      "product_variant",
      "product_variant.id",
      "customer_order_detail.variant_id",
    )
    .innerJoin("product", "product.id", "product_variant.product_id")
    .groupBy("product_variant.id");

  if (startDate && endDate) {
    query.whereBetween("customer_order.paid_at", [startDate, endDate]);
  }

  if (warehouseId) {
    query.where("customer_order.warehouse_id", warehouseId);
  }

  const rows = await query.clone().select();

  const result = rows.map((row) => {
    return {
      ...row,
      qty: Number(row.qty),
      discount_amount: Number(row.discount_amount),
      total_amount: Number(row.total_amount),
    };
  });

  return NextResponse.json(
    {
      success: true,
      result,
      error: "",
    },
    { status: 200 },
  );
});
