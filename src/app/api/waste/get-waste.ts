import {
  StockWasteService,
  WasteEntry,
  WasteSummary,
} from "@/classes/stock-waste";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { WASTE_REASON_CODES } from "@/lib/waste-reasons";
import { NextResponse } from "next/server";
import { z } from "zod";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const wasteListInput = z.object({
  from: date.optional(),
  to: date.optional(),
  wasteType: z.enum(["WASTE", "NON_SALE"]).optional(),
  reason: z.enum(WASTE_REASON_CODES).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  offset: z.coerce.number().int().min(0).default(0),
});

export type WasteListInput = z.input<typeof wasteListInput>;
export interface WasteListResult {
  data: WasteEntry[];
  total: number;
  summary: WasteSummary;
}

export const getWasteList = withAuthApi<
  unknown,
  unknown,
  ResponseType<WasteListResult>,
  WasteListInput
>(async ({ db, userAuth, searchParams }) => {
  const filter = wasteListInput.parse(searchParams ?? {});
  const result = await new StockWasteService(db, userAuth.admin!).list(filter);
  return NextResponse.json({ success: true, result }, { status: 200 });
});
