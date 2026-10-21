import { recordWasteSchema, StockWasteService } from "@/classes/stock-waste";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

export type RecordWasteBody = z.infer<typeof recordWasteSchema>;

export const recordWaste = withAuthApi<
  unknown,
  RecordWasteBody,
  ResponseType<string>
>(async ({ db, body, userAuth, logger }) => {
  const input = recordWasteSchema.parse(body);
  try {
    const id = await new StockWasteService(db, userAuth.admin!).record(input);

    logger.serverLog("waste:create", {
      action: "create",
      table_name: "stock_waste",
      key: id,
      content: input,
    });

    return NextResponse.json({ success: true, result: id }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 400 },
    );
  }
});
