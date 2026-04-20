import { table_pricing_template } from "@/generated/tables";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { createPricingTemplate } from "./template-create";
import { updatePricingTemplate } from "./template-update";
import { deletePricingTemplate } from "./template-delete";

export const GET = withAuthApi<
  unknown,
  unknown,
  ResponseType<table_pricing_template[]>
>(async ({ db, userAuth }) => {
  const warehouseId = userAuth.admin?.currentWarehouseId;

  const items = await db
    .table("pricing_template")
    .where("deleted_at", null)
    .andWhere("warehouse_id", warehouseId)
    .orderBy("created_at", "desc");

  // Parse the JSON stringified extra_seat_prices field
  const parsedItems: table_pricing_template[] = items.map(
    (item: Record<string, unknown>) => ({
      ...item,
      extra_seat_prices:
        typeof item.extra_seat_prices === "string"
          ? JSON.parse(item.extra_seat_prices)
          : item.extra_seat_prices,
    })
  ) as table_pricing_template[];

  return NextResponse.json(
    { success: true, result: parsedItems },
    { status: 200 }
  );
});

export const POST = createPricingTemplate;
export const PUT = updatePricingTemplate;
export const DELETE = deletePricingTemplate;
