import { UserInfo } from "@/lib/server-functions/get-auth-from-token";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import moment from "moment-timezone";
import { NextResponse } from "next/server";

export interface EndOfDayReportResponse {
  totalSale: number;
  transactionCount: number;
  servedSummary: Record<string, { qty: number; amount: number }>;
  paymentSummary: Record<string, { qty: number; amount: number }>;
  discountSummary: Record<string, { qty: number; amount: number }>;
  categorySummary: Record<string, { qty: number; amount: number }>;
  customerSummary: Record<string, { qty: number; amount: number }>;
  user: UserInfo;
  startDate: string;
  endDate: string;
}

export const endOfDayReport = withAuthApi<
  unknown,
  unknown,
  ResponseType<EndOfDayReportResponse>,
  { startDate: string; endDate: string; warehouseId?: string }
>(async ({ db, searchParams, userAuth }) => {
  const query = db
    .table("customer_order_detail")
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
    .innerJoin(
      "product_categories",
      "product_categories.product_id",
      "product_variant.product_id",
    )
    .innerJoin(
      "product_category",
      "product_category.id",
      "product_categories.category_id",
    )
    .innerJoin("customer", "customer.id", "customer_order.customer_id");

  if (searchParams?.warehouseId) {
    query.where("customer_order.warehouse_id", "=", searchParams.warehouseId);
  }

  if (searchParams?.startDate && searchParams?.endDate) {
    query.whereBetween("customer_order.paid_at", [
      new Date(searchParams.startDate),
      new Date(searchParams.endDate),
    ]);
  }

  const select = query
    .clone()
    .select(
      "customer_order_detail.*",
      "customer_order.served_type",
      "customer.customer_name",
      "product_category.title",
    )
    .orderBy("customer_order_detail.created_at", "asc");

  const result = await select;

  const payments = await db.table("order_payment").whereIn(
    "order_id",
    result.map((r) => r.order_id),
  );

  const paymentMethods = await db.table("payment_method").select("*");

  // --- Overall Totals ---
  const totalSale = result.reduce(
    (sum, o) => sum + parseFloat(o.total_amount),
    0,
  );
  const transactionCount = new Set(result.map((o) => o.order_id)).size;
  const startDate = result.at(0)?.created_at || new Date();
  const endDate = result.at(-1)?.created_at || new Date();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orderMap: Record<string, any> = {};
  result.map((o) => {
    const key = `${o.order_id}-${o.servered_type}`;
    if (!orderMap[key]) {
      orderMap[key] = {
        ...o,
        servered_type: o.served_type,
        total_amount: 0,
        discount_amount: 0,
        qty: 0,
      };
    }
    orderMap[key].total_amount += parseFloat(o.total_amount);
    orderMap[key].discount_amount += parseFloat(o.discount_amount);
    orderMap[key].qty += o.qty;
  });
  const uniqueOrders = Object.values(orderMap);
  const servedSummary: Record<string, { qty: number; amount: number }> = {};
  const paymentSummary: Record<string, { qty: number; amount: number }> = {};
  const discountSummary: Record<string, { qty: number; amount: number }> = {};
  const categorySummary: Record<string, { qty: number; amount: number }> = {};
  const customerSummary: Record<string, { qty: number; amount: number }> = {};

  uniqueOrders.forEach((o) => {
    const payment = payments.filter((p) => p.order_id === o.order_id);

    // served type summary
    const type = o.served_type || "Unknown";
    if (!servedSummary[type]) servedSummary[type] = { qty: 0, amount: 0 };
    servedSummary[type].qty += 1;
    servedSummary[type].amount += parseFloat(o.total_amount);

    // payment type summary
    payment.forEach((p) => {
      const method = paymentMethods.find(
        (f) => f.method_id === p.payment_method,
      ).method;
      const payType = method || "Unknown";
      if (!paymentSummary[payType])
        paymentSummary[payType] = { qty: 0, amount: 0 };
      paymentSummary[payType].qty += 1;
      paymentSummary[payType].amount += parseFloat(p.amount_used);
    });

    // discount summary
    if (parseFloat(o.discount_amount) > 0) {
      if (o.served_type !== "food_delivery") {
        const discType = "Discount Customer";
        if (!discountSummary[discType]) {
          discountSummary[discType] = { qty: 0, amount: 0 };
        }
        discountSummary[discType].qty += 1;
        discountSummary[discType].amount += parseFloat(o.discount_amount);
      } else {
        const discType = "Discount Delivery";
        if (!discountSummary[discType]) {
          discountSummary[discType] = { qty: 0, amount: 0 };
        }
        discountSummary[discType].qty += 1;
        discountSummary[discType].amount += parseFloat(o.discount_amount);
      }
    }

    // customer summary
    const cust = o.customer_name || "Unknown";
    if (!customerSummary[cust]) customerSummary[cust] = { qty: 0, amount: 0 };
    customerSummary[cust].qty += 1;
    customerSummary[cust].amount += parseFloat(o.total_amount);
  });

  result.forEach((o) => {
    // category summary
    const cat = o.title?.trim() || "Unknown";
    if (!categorySummary[cat]) categorySummary[cat] = { qty: 0, amount: 0 };
    categorySummary[cat].qty += 1;
    categorySummary[cat].amount += parseFloat(o.total_amount);
  });

  discountSummary["Total Discount"] = Object.values(discountSummary).reduce(
    (acc, d) => ({ qty: acc.qty + d.qty, amount: acc.amount + d.amount }),
    { qty: 0, amount: 0 },
  );

  return NextResponse.json(
    {
      success: true,
      result: {
        startDate: moment(startDate).format("YYYY-MM-DD HH:mm:ss"),
        endDate: moment(endDate).format("YYYY-MM-DD HH:mm:ss"),
        totalSale,
        transactionCount,
        servedSummary,
        paymentSummary,
        discountSummary,
        categorySummary,
        customerSummary,
        user: userAuth.admin!,
      },
    },
    { status: 200 },
  );
});
