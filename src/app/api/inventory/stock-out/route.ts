import { SlotMovementService } from "@/classes/slot-movement";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const inputSchema = z.object({
  slotId: z.string().nonempty(),
  variantId: z.string().nonempty(),
  lotId: z.string().optional(),
  qty: z.number().refine((value) => value > 0, {
    message: "Quantity must be greater than 0",
  }),
});

export type InputStockOutWithLotSchema = z.infer<typeof inputSchema>;

export const POST = withAuthApi<
  unknown,
  InputStockOutWithLotSchema,
  ResponseType<string[]>
>(async ({ db, userAuth, body }) => {
  const { slotId, variantId, lotId, qty } = inputSchema.parse(body);
  const stockMovementService = new SlotMovementService(db);
  const trx = await stockMovementService.stockout({
    variantId,
    slotId,
    qty,
    lotId,
    createdBy: userAuth.admin!,
    transactionType: "STOCK_OUT",
  });

  return NextResponse.json({ success: true, result: trx }, { status: 200 });
});
