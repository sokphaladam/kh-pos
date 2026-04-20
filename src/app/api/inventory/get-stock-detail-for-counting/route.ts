import {
  StockCountingService,
  StockDetailForCounting,
} from "@/classes/stock-counting";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const inputSchema = z.object({
  variant_id: z.string().nonempty(),
  slot_id: z.string().nonempty(),
});

export const GET = withAuthApi<
  unknown,
  unknown,
  ResponseType<StockDetailForCounting>
>(async ({ db, userAuth, searchParams }) => {
  const params = inputSchema.parse(searchParams);
  const stockCountingService = new StockCountingService(db, userAuth.admin!);
  const stockDetails = await stockCountingService.getStockDetailByVariant(
    params.variant_id,
    params.slot_id
  );
  return NextResponse.json(
    { success: true, result: stockDetails },
    { status: 200 }
  );
});
