import { VoidOrderData } from "@/app/admin/(admin)/reports/void-order/types";
import { LoaderFactory } from "@/dataloader/loader-factory";
import { Formatter } from "@/lib/formatter";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

export const getOrderVoidReport = withAuthApi<
  unknown,
  unknown,
  ResponseType<VoidOrderData[]>,
  { startDate?: string; endDate?: string }
>(async ({ db, searchParams }) => {
  const query = db
    .table("print_kitchen_log")
    .leftJoin(
      "customer_order",
      "customer_order.order_id",
      "print_kitchen_log.order_id",
    )
    .leftJoin(
      "customer_order_detail",
      "customer_order_detail.order_detail_id",
      "print_kitchen_log.order_detail_id",
    );

  if (searchParams?.startDate && searchParams?.endDate) {
    query.whereBetween("printed_at", [
      searchParams.startDate,
      searchParams.endDate,
    ]);
  }

  const inner = query
    .clone()
    .select(
      "customer_order.invoice_no",
      "print_kitchen_log.order_id",
      "print_kitchen_log.order_detail_id",
      db.raw(
        "SUM(SUBSTRING_INDEX(JSON_UNQUOTE(JSON_EXTRACT(content, '$[4].value')), 'x', -1)) AS qty_from_kitchen",
      ),
      "print_kitchen_log.item_price as price_from_kitchen",
      "customer_order_detail.qty as qty_from_order",
      "customer_order_detail.price as price_from_order",
      "print_kitchen_log.printed_at",
      "customer_order.order_id as customer_order_id",
      "print_kitchen_log.content",
    )
    .orderBy("printed_at", "desc")
    .groupBy("print_kitchen_log.order_detail_id");

  const printLog = await db
    .select("*")
    .from(inner.as("t"))
    .whereRaw("t.qty_from_kitchen != t.qty_from_order OR t.invoice_no IS NULL");

  const loaderPayment = LoaderFactory.orderPaymentLoader(db);

  const result = await Promise.all(
    printLog.map(async (item) => {
      const payments = item.customer_order_id
        ? await loaderPayment.load(item.customer_order_id)
        : null;
      return {
        invoice: item.invoice_no,
        orderId: item.order_id,
        orderDetailId: item.order_detail_id,
        printedAt: item.printed_at
          ? (Formatter.dateTime(item.printed_at) ?? undefined)
          : undefined,
        qtyFromPrintLog: Number(item.qty_from_kitchen),
        priceFromPrintLog: Number(item.price_from_kitchen),
        actualQty: Number(item.qty_from_order),
        actualPrice: Number(item.price_from_order),
        status: item.customer_order_id ? "ABNORMAL" : "VOIDED",
        content: item.content,
        payments,
      };
    }),
  );

  return NextResponse.json(
    {
      success: true,
      result,
      error: "",
    },
    { status: 200 },
  );
});
