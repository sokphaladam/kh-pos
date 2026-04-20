import { Order, OrderDetail, OrderService } from "@/classes/order";
import { Payment } from "@/classes/payment";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { deleteOrder } from "./delete-order";

export const GET = withAuthApi<
  { id: string },
  unknown,
  ResponseType<{
    orderInfo: Order;
    orderDetail: OrderDetail[];
    payments: Payment[];
  }>
>(async ({ db, userAuth, params }) => {
  if (!params?.id) {
    return NextResponse.json(
      { success: false, message: "Order ID is required" },
      { status: 400 }
    );
  }

  const orderService = new OrderService(db);
  const result = await orderService.getOrderDetail(params.id, userAuth.admin!);
  return NextResponse.json(
    {
      success: true,
      result,
    },
    { status: 200 }
  );
});

export const DELETE = deleteOrder;
