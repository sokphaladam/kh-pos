import { StockCountingService } from "@/classes/stock-counting";
import { Slot } from "@/dataloader/slot-loader";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const inputSchema = z.object({
  id: z.string().nonempty(),
});

export const GET = withAuthApi<
  unknown,
  unknown,
  ResponseType<(Slot | null)[]>,
  { id: string }
>(async ({ db, userAuth, searchParams }) => {
  const variantId = inputSchema.parse(searchParams).id;

  const stockCountingService = new StockCountingService(db, userAuth.admin!);
  const slots = await stockCountingService.getSlotsByVariant(variantId);

  return NextResponse.json({ success: true, result: slots }, { status: 200 });
});
