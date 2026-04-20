import { OrderService } from "@/classes/order";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

export const deleteOrder = withAuthApi<
  { id: string },
  unknown,
  ResponseType<boolean>
>(async ({ db, params, logger }) => {
  if (!params?.id) {
    return NextResponse.json(
      { success: false, message: "Order ID is required" },
      { status: 400 },
    );
  }

  console.log("Deleting order with ID:", params.id);

  const orderService = new OrderService(db);

  const isCompleted = await orderService.checkOrderCompleted(params.id);

  if (isCompleted) {
    throw new Error("Order already checkout");
  }

  const result = await orderService.delete(params.id, logger);

  return NextResponse.json(
    {
      success: true,
      result: result,
    },
    { status: 200 },
  );
});
