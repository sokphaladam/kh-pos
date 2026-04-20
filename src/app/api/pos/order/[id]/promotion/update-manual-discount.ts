import { OrderService } from "@/classes/order";
import { OrderDiscountService } from "@/classes/order-discount";
import { CustomerOrderDiscount } from "@/dataloader/discount-by-order-items-loader";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateManualDiscountSchema = z.array(
  z.object({
    itemId: z.string().uuid(),
    amount: z.number().default(0),
    discountType: z.enum(["PERCENTAGE", "AMOUNT"]).default("AMOUNT"),
  })
);

const idSchema = z.object({
  id: z.string(),
});

export const updateManualDiscount = withAuthApi<
  { id: string },
  { itemId: string; amount: string; discountType: "PERCENTAGE" | "AMOUNT" },
  ResponseType<{
    totalDiscount: number;
    orderItemAmount: number;
    discountLog: CustomerOrderDiscount[];
  }>
>(async ({ body, userAuth, params, db }) => {
  const { id } = idSchema.parse(params);
  const input = updateManualDiscountSchema.parse(body).map((x) => {
    return {
      orderId: id,
      itemId: x.itemId,
      amount: x.amount,
      user: userAuth.admin!,
      discountType: x.discountType,
    };
  });

  const orderService = new OrderService(db);
  const orderDiscountService = new OrderDiscountService(db);

  const isCompleted = await orderService.checkOrderCompleted(id);
  if (isCompleted) {
    throw new Error("Order already checked-out");
  }
  const result = await orderDiscountService.updateManualDiscount(input);

  return NextResponse.json({
    success: true,
    data: result,
  });
});
