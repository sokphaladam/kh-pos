import { CountSheetItem, StockCountService } from "@/classes/stock-count";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const sheetInput = z.object({
  slotId: z.string().nonempty(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  // Blind count by default: counters should not see the expected qty.
  expected: z.enum(["0", "1"]).default("0"),
});

export type CountSheetInput = z.input<typeof sheetInput>;

export const GET = withAuthApi<
  unknown,
  unknown,
  ResponseType<CountSheetItem[]>,
  CountSheetInput
>(async ({ db, userAuth, searchParams }) => {
  const { slotId, date, expected } = sheetInput.parse(searchParams ?? {});
  const result = await new StockCountService(db, userAuth.admin!).getSheet(
    slotId,
    date,
    expected === "1",
  );
  return NextResponse.json({ success: true, result }, { status: 200 });
});
