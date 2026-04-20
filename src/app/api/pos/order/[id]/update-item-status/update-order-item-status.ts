import { OrderService } from "@/classes/order";
import { OrderStatusService } from "@/classes/order-status";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const UpdateOrderItemStatusSchema = z
  .array(
    z.object({
      orderDetailId: z.string(),
      fromStatus: z.enum(["pending", "cooking"]),
      toStatus: z.enum(["cooking", "served"]),
      qty: z.number().min(1),
    })
  )
  .min(1);

export type UpdateOrderItemStatusSchemaAPIInput = z.infer<
  typeof UpdateOrderItemStatusSchema
>;

const idSchema = z.object({
  id: z.string(),
});

export const updateOrderItemStatusAPI = withAuthApi<
  { id: string },
  UpdateOrderItemStatusSchemaAPIInput,
  ResponseType<boolean>
>(async ({ db, params, body, userAuth }) => {
  const order = new OrderService(db);

  const { id } = idSchema.parse(params);

  const isCompleted = await order.checkOrderCompleted(id);

  if (isCompleted) {
    throw new Error("Order already checkout");
  }

  const input = UpdateOrderItemStatusSchema.parse(body);

  const update = new OrderStatusService(db, userAuth.admin!);
  for (const item of input) {
    await update.updateOrderItemStatusUsingActualStatus(
      item.orderDetailId,
      item.qty,
      item.fromStatus,
      item.toStatus
    );
  }

  return NextResponse.json({ success: true }, { status: 200 });
});
