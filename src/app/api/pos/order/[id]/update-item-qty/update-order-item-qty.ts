import { OrderService } from "@/classes/order";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const schemaUpdateOrderItemQty = z.object({
  qty: z.string(),
  item_id: z.string(),
  reservation: z
    .array(
      z.object({
        showtimeId: z.string(),
        seatId: z.string(),
        price: z.number(),
        code: z.string().optional(),
      })
    )
    .optional(),
});

export type UpdateOrderItemQtyInput = z.infer<typeof schemaUpdateOrderItemQty>;

export const updateOrderItemQty = withAuthApi<
  { id: string },
  UpdateOrderItemQtyInput,
  ResponseType<unknown>
>(async ({ params, db, body, userAuth }) => {
  const input = schemaUpdateOrderItemQty.parse(body);
  if (!params?.id) {
    return NextResponse.json(
      { success: false, message: "Order ID is required" },
      { status: 400 }
    );
  }

  const order = new OrderService(db, userAuth.admin!);

  const isCompleted = await order.checkOrderCompleted(params.id);

  if (isCompleted) {
    throw new Error("Order already checked-out");
  }

  const qty = Number(input?.qty);
  const itemId = input?.item_id ?? "";
  const reservation = input?.reservation || [];

  order.updateOrderItem(params.id, itemId, qty, reservation);

  return NextResponse.json({ success: true }, { status: 200 });
});
