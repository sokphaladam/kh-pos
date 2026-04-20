import { LoaderFactory } from "@/dataloader/loader-factory";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getBrandIntegration } from "./get-brand-integration";
import { formatCurrency } from "@/lib/currency";

const filterSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  warehouseId: z.string().optional(),
});

type filterSchemaType = z.infer<typeof filterSchema>;

export const warehouseSaleListReport = withAuthApi<
  unknown,
  unknown,
  ResponseType<unknown>,
  filterSchemaType
>(async ({ db, searchParams }) => {
  const { startDate, endDate } = filterSchema.parse(searchParams);

  const warehouses = await db
    .table("warehouse")
    .where("is_deleted", false)
    .select("id");

  const query = db
    .table("customer_order")
    .join(
      "customer_order_detail",
      "customer_order.order_id",
      "customer_order_detail.order_id",
    );

  if (startDate && endDate) {
    query.whereBetween("customer_order.paid_at", [startDate, endDate]);
  }

  const rows = await query
    .select(
      db.raw(
        "SUM(customer_order_detail.qty * customer_order_detail.price - customer_order_detail.discount_amount) AS total_amount",
      ),
      "customer_order.warehouse_id",
    )
    .groupBy("customer_order.warehouse_id")
    .orderBy("total_amount", "desc");

  const warehouseLoader = LoaderFactory.warehouseLoader(db);

  const setting = await db.table("setting").where("option", "CURRENCY").first();

  const currentCurrencyCode = setting?.value || "USD";

  const brandIntegrationResults = await getBrandIntegration(db, {
    startDate,
    endDate,
  });

  const result = await Promise.all(
    warehouses.map(async (warehouse) => {
      const row = rows.find((r) => r.warehouse_id === warehouse.id);
      if (!row) {
        return {
          total_amount: formatCurrency(0, currentCurrencyCode, {
            showSymbol: true,
            minimumFractionDigits: currentCurrencyCode === "KHR" ? 0 : 2,
            maximumFractionDigits: currentCurrencyCode === "KHR" ? 0 : 2,
          }),
          warehouse_id: warehouse.id,
          warehouse: await warehouseLoader.load(warehouse.id),
        };
      }
      return {
        ...row,
        total_amount: formatCurrency(row.total_amount, currentCurrencyCode, {
          showSymbol: true,
          minimumFractionDigits: currentCurrencyCode === "KHR" ? 0 : 2,
          maximumFractionDigits: currentCurrencyCode === "KHR" ? 0 : 2,
        }),
        warehouse: await warehouseLoader.load(row.warehouse_id),
      };
    }),
  );

  return NextResponse.json(
    {
      result: {
        local: result,
        integration: brandIntegrationResults,
      },
      success: true,
    },
    { status: 200 },
  );
});
