import { DiscountService } from "@/classes/discount";
import { table_discount } from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

export const discountInputSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  discountType: z.enum(["AMOUNT", "PERCENTAGE"]),
  value: z.number().default(0),
  warehouseId: z.string(),
});

export type DiscountInput = z.infer<typeof discountInputSchema>;

export const createDiscount = withAuthApi<
  unknown,
  DiscountInput,
  ResponseType<DiscountInput>
>(async ({ userAuth, body, db, logger }) => {
  const discount = new DiscountService(db);
  const user = userAuth.admin!;

  const schema = discountInputSchema.parse(body);
  const now = Formatter.getNowDateTime();
  const input = {
    discount_id: schema.id,
    title: schema.title,
    description: schema.description || "",
    discount_type: schema.discountType,
    value: String(schema.value),
    created_at: now,
    created_by: user.id,
    update_at: now,
    updated_by: user.id,
    warehouse_id: schema.warehouseId,
  };

  await discount.create(input as table_discount);

  logger.serverLog("discount:POST", {
    action: "create",
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
