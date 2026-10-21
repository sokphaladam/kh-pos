import { StockCountService, StockCountSummary } from "@/classes/stock-count";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const listInput = z.object({
  from: day.optional(),
  to: day.optional(),
  slotId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  offset: z.coerce.number().int().min(0).default(0),
});

export type StockCountListInput = z.input<typeof listInput>;
export interface StockCountListResult {
  data: StockCountSummary[];
  total: number;
}

export const getStockCounts = withAuthApi<
  unknown,
  unknown,
  ResponseType<StockCountListResult>,
  StockCountListInput
>(async ({ db, userAuth, searchParams }) => {
  const filter = listInput.parse(searchParams ?? {});
  const result = await new StockCountService(db, userAuth.admin!).list(filter);
  return NextResponse.json({ success: true, result }, { status: 200 });
});
