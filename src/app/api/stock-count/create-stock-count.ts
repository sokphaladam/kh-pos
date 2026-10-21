import {
  createStockCountSchema,
  StockCountService,
} from "@/classes/stock-count";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

export type CreateStockCountBody = z.infer<typeof createStockCountSchema>;

export const createStockCount = withAuthApi<
  unknown,
  CreateStockCountBody,
  ResponseType<string>
>(async ({ db, body, userAuth, logger }) => {
  const input = createStockCountSchema.parse(body);
  try {
    const id = await new StockCountService(db, userAuth.admin!).create(input);

    logger.serverLog("stock-count:create", {
      action: "create",
      table_name: "stock_count",
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
