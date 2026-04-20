import { table_discount } from "@/generated/tables";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { DiscountInput, discountInputSchema } from "./create-discount";
import { Formatter } from "@/lib/formatter";
import { DiscountService } from "@/classes/discount";

export const updateDiscount = withAuthApi<
  unknown,
  DiscountInput,
  ResponseType<DiscountInput>
>(async ({ userAuth, body, db, logger }) => {
  const discount = new DiscountService(db);
  const schema = discountInputSchema.parse(body);
  const now = Formatter.getNowDateTime();
  const input = {
    title: schema.title,
    description: schema.description ?? "",
    discount_type: schema.discountType,
    value: String(schema.value),
    update_at: now,
    updated_by: userAuth.admin!.id,
    warehouse_id: schema.warehouseId,
  };

  await discount.update(schema.id, input as table_discount);
  logger.serverLog("discount:PUT", {
    action: "update",
    table_name: "discount",
    key: schema.id,
    content: schema,
  });

  return NextResponse.json(
    {
      success: true,
      result: schema,
    },
    { status: 200 }
  );
});
