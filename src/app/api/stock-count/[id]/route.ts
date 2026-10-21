import { StockCountService } from "@/classes/stock-count";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

export type StockCountDetail = NonNullable<
  Awaited<ReturnType<StockCountService["detail"]>>
>;

export const GET = withAuthApi<
  { id: string },
  unknown,
  ResponseType<StockCountDetail>
>(async ({ db, userAuth, params }) => {
  const { id } = z.object({ id: z.string() }).parse(params);
  const result = await new StockCountService(db, userAuth.admin!).detail(id);
  if (!result) {
    return NextResponse.json(
      { success: false, error: "Stock count not found" },
      { status: 404 },
    );
  }
  return NextResponse.json({ success: true, result }, { status: 200 });
});
