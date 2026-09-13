import { OrderService } from "@/classes/order";
import { KitchenPrintItem, OrderStatusService } from "@/classes/order-status";
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

export type UpdateOrderItemStatusResponse = ResponseType<boolean> & {
  // "pending" -> "cooking" transitions push straight to this device's
  // print-socket bridge instead of waiting on the print_queue poller - see
  // pushKitchenTicketsDirectToPrinter. Empty when nothing transitioned to
  // cooking (e.g. a "served" update) or no printer matched the item.
  kitchenPrintItems?: KitchenPrintItem[];
};

export const updateOrderItemStatusAPI = withAuthApi<
  { id: string },
  UpdateOrderItemStatusSchemaAPIInput,
  UpdateOrderItemStatusResponse
>(async ({ db, params, body, userAuth }) => {
  const order = new OrderService(db);

  const { id } = idSchema.parse(params);

  const isCompleted = await order.checkOrderCompleted(id);

  if (isCompleted) {
    throw new Error("Order already checkout");
  }

  const input = UpdateOrderItemStatusSchema.parse(body);

  const update = new OrderStatusService(db, userAuth.admin!);
  const kitchenPrintItems: KitchenPrintItem[] = [];
  for (const item of input) {
    const printed = await update.updateOrderItemStatusUsingActualStatus(
      item.orderDetailId,
      item.qty,
      item.fromStatus,
      item.toStatus
    );
    if (printed) kitchenPrintItems.push(printed);
  }

  return NextResponse.json(
    { success: true, kitchenPrintItems },
    { status: 200 }
  );
});
