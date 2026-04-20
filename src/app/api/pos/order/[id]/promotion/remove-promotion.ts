import { OrderService } from "@/classes/order";
import { OrderDiscountService } from "@/classes/order-discount";
import { CustomerOrderDiscount } from "@/dataloader/discount-by-order-items-loader";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const removePromotionSchema = z.object({
  itemId: z.string().uuid(),
  discountId: z.string().uuid(),
});

const idSchema = z.object({
  id: z.string(),
});

export const removePromotion = withAuthApi<
  { id: string },
  { itemId: string; discountId: string },
  ResponseType<{
    totalDiscount: number;
    orderItemAmount: number;
    discountLog: CustomerOrderDiscount[];
  }>
>(async ({ body, params, db }) => {
  const { id } = idSchema.parse(params);
  const input = removePromotionSchema.parse(body);

  const orderService = new OrderService(db);
  const orderDiscountService = new OrderDiscountService(db);
  const isCompleted = await orderService.checkOrderCompleted(id);
  if (isCompleted) {
    throw new Error("Order already checked-out");
  }

  const { totalDiscount, orderItemAmount, discountLog } =
    await orderDiscountService.removePromotion({
      orderId: id,
      itemId: input.itemId,
      discountId: input.discountId,
    });

  return NextResponse.json({
    success: true,
    data: {
      totalDiscount,
      orderItemAmount,
      discountLog,
    },
  });
});
