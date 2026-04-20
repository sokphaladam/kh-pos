import { SlotMovementService } from "@/classes/slot-movement";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const inputSchema = z.object({
  slotId: z.string().nonempty(),
  variantId: z.string().nonempty(),
  lotNumber: z.string().nullable().optional(),
  expiredAt: z.string().optional(),
  manufacturedAt: z.string().optional(),
  costPerUnit: z.number().optional(),
  qty: z.number().refine((value) => value > 0, {
    message: "Quantity must be greater than 0",
  }),
});

export type InputStockInSchema = z.infer<typeof inputSchema>;

export const POST = withAuthApi<
  unknown,
  InputStockInSchema,
  ResponseType<{ transactionId: string; lotId: string }>
>(async ({ db, userAuth, body }) => {
  const {
    slotId,
    variantId,
    lotNumber,
    expiredAt,
    manufacturedAt,
    costPerUnit,
    qty,
  } = inputSchema.parse(body);

  const stockMovementService = new SlotMovementService(db);
  const trxId = await stockMovementService.stockin({
    variantId,
    slotId,
    productLot: {
      variantId,
      lotNumber,
      expiredAt,
      manufacturedAt,
      costPerUnit,
    },
    qty,
    createdBy: userAuth.admin!,
    transactionType: "STOCK_IN",
  });

  if (!trxId.lotId) {
    return NextResponse.json(
      { success: false, message: "Failed to create lot" },
      { status: 400 },
    );
  }

  return NextResponse.json({ success: true, result: { transactionId: trxId.transactionId, lotId: trxId.lotId } }, { status: 200 });
});
