import { SlotMovementService } from "@/classes/slot-movement";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { inputStockinSchema } from "./type";

export const POST = withAuthApi<
  unknown,
  unknown,
  ResponseType<boolean>,
  unknown
>(async ({ db, body, userAuth }) => {
  const input = inputStockinSchema.parse(body);

  await new SlotMovementService(db).stockin({
    ...input,
    createdBy: userAuth.admin!,
    productLot: { ...input.productLot, variantId: input.variantId },
    transactionType: "STOCK_IN",
  });

  return NextResponse.json({ success: true, result: true }, { status: 200 });
});
