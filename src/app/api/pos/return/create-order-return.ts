import { OrderReturnInput, OrderReturnService } from "@/classes/order-return";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const orderReturnSchema = z.array(
  z.object({
    orderId: z.string(),
    orderItemId: z.string(),
    quantity: z.number().min(1),
    refundAmount: z.number().min(0),
    reason: z.string().optional(),
  })
);

export const createOrderReturn = withAuthApi<
  unknown,
  OrderReturnInput[],
  ResponseType<string[]>
>(async ({ body, db, userAuth }) => {
  const orderReturnService = new OrderReturnService(db, userAuth.admin!);
  const data = orderReturnSchema.parse(body);

  const returnIds = await orderReturnService.createOrderReturn(
    data.map((item) => ({
      ...item,
      status: "returned",
    }))
  );
  return NextResponse.json(
    {
      success: true,
      result: returnIds,
    },
    { status: 200 }
  );
});
