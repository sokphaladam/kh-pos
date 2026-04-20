import {
  TransferOrderTableService,
  TransferProp,
} from "@/classes/transfer-order-table";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const transferSchema = z.object({
  sourceTableId: z.string().min(1),
  orderId: z.string().min(1),
  orderItems: z.array(
    z.object({
      orderItemId: z.string().min(1),
      variantId: z.string().min(1),
      orderItemStatuses: z.array(
        z.object({
          status: z.enum([
            "pending",
            "cooking",
            "ready",
            "served",
            "cancelled",
          ]),
          quantity: z.number().min(1),
        })
      ),
    })
  ),
  destinationTableId: z.string().min(1),
});

export const POST = withAuthApi<unknown, TransferProp, ResponseType<string>>(
  async ({ db, userAuth, body }) => {
    const transferService = new TransferOrderTableService(db, userAuth.admin!);
    const input: TransferProp = transferSchema.parse(body);
    const result = await transferService.createOrderTransfer(input);
    return NextResponse.json({ success: true, result }, { status: 200 });
  }
);
