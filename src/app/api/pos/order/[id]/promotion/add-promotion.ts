import { OrderService } from "@/classes/order";
import { OrderDiscountService } from "@/classes/order-discount";
import { CustomerOrderDiscount } from "@/dataloader/discount-by-order-items-loader";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const addPromotionSchema = z.object({
  itemId: z.string().uuid(),
  discountId: z.string().uuid().optional(),
  discountAutoId: z.string().optional(),
});

const idSchema = z.object({
  id: z.string(),
});

export const addPromotion = withAuthApi<
  { id: string },
  { itemId: string; discountId: string },
  ResponseType<{
    totalDiscount: number;
    orderItemAmount: number;
    discountLog: CustomerOrderDiscount[];
  }>
>(async ({ body, userAuth, params, db }) => {
  const { id } = idSchema.parse(params);
  const input = addPromotionSchema.parse(body);

  if (!input.discountId && !input.discountAutoId) {
    throw new Error("discountId or discountAutoId is required");
  }

  const orderService = new OrderService(db);
  const orderDiscountService = new OrderDiscountService(db);

  const isCompleted = await orderService.checkOrderCompleted(id);
  if (isCompleted) {
    throw new Error("Order already checked-out");
  }

  const insertData = {
    ...input,
  };

  if (!!input.discountAutoId) {
    const discount = await db
      .table("discount")
      .where({ auto_id: input.discountAutoId })
      .first();

    if (!discount) {
      throw new Error("Discount not found");
    }

    insertData.discountId = discount?.discount_id;
  }

  const { totalDiscount, orderItemAmount, discountLog } =
    await orderDiscountService.addPromotion({
      orderId: id,
      itemId: insertData.itemId,
      discountId: insertData.discountId || "",
      user: userAuth.admin!,
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
