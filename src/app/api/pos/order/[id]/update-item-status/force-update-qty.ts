import { OrderService } from "@/classes/order";
import { OrderStatusService } from "@/classes/order-status";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const UpdateOrderItemStatusSchema = z.object({
  orderDetailId: z.string(),
  status: z.enum(["pending", "cooking", "served"]),
  qty: z.number().min(0),
});

export type UpdateOrderItemStatusSchemaInput = z.infer<
  typeof UpdateOrderItemStatusSchema
>;

const idSchema = z.object({
  id: z.string(),
});

export const forceUpdateQtyByStatus = withAuthApi<
  { id: string },
  UpdateOrderItemStatusSchemaInput,
  ResponseType<boolean>
>(
  async ({ db, params, body, userAuth }) => {
    const order = new OrderService(db);

    const { id } = idSchema.parse(params);

    const isCompleted = await order.checkOrderCompleted(id);

    if (isCompleted) {
      throw new Error("Order already checkout");
    }

    const input = UpdateOrderItemStatusSchema.parse(body);

    const update = new OrderStatusService(
      db,
      userAuth.admin! || {
        ...userAuth.customer,
        currentWarehouseId: userAuth.customer?.warehouseId || "",
      }
    );
    await update.forceUpdateOrderItemStatusQty({
      orderItemId: input.orderDetailId,
      status: input.status,
      qty: input.qty,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  },
  ["ADMIN", "CUSTOMER"]
);
