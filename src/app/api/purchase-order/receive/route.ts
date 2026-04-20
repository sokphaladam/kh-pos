import { ReceivePurchaseOrder } from "@/classes/receive-po";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const inputSchema = z.object({
  purchaseOrderId: z.string().nonempty(),
  receivedItems: z
    .array(
      z.object({
        purchaseOrderDetailId: z.string().nonempty(),
        slotId: z.string().nonempty(),
        lotNumber: z.string().optional(),
        expiredAt: z.string().optional(),
        manufacturedAt: z.string().optional(),
        costPerUnit: z.number().optional(),
        qty: z.number().refine((value) => value > 0, {
          message: "Quantity must be greater than 0",
        }),
      })
    )
    .nonempty(),
});

export const POST = withAuthApi<unknown, unknown, ResponseType<string>>(
  async ({ db, userAuth, body }) => {
    const { purchaseOrderId, receivedItems } = inputSchema.parse(body);

    const receivePurchaseOrder = new ReceivePurchaseOrder(db, purchaseOrderId);
    const receivedId = await receivePurchaseOrder.receive({
      receivedItems,
      createdBy: userAuth.admin!,
    });

    return NextResponse.json(
      { success: true, result: receivedId },
      { status: 200 }
    );
  }
);
