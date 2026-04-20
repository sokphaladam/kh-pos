import { SlotMovementService } from "@/classes/slot-movement";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { NextResponse } from "next/server";
import { z } from "zod";

const inputTransferSchema = z.object({
  variantId: z.string(),
  currentSlotId: z.string(),
  destinationSlotId: z.string(),
  qty: z.number(),
  orderId: z.string().optional(),
});

export type TransferInput = z.infer<typeof inputTransferSchema>;

export const POST = withAuthApi(async ({ body, db, userAuth }) => {
  const input = inputTransferSchema.parse(body);

  await new SlotMovementService(db).transfer({
    ...input,
    createdBy: userAuth.admin!.id,
  });

  return NextResponse.json({ success: true, result: true }, { status: 200 });
});
