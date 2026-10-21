import {
  StockVarianceService,
  VarianceItem,
  VarianceSummary,
} from "@/classes/stock-variance";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const varianceInput = z
  .object({ from: day, to: day })
  .refine((v) => v.from <= v.to, { message: "from must be before to" });

export type StockVarianceInput = z.input<typeof varianceInput>;
export interface StockVarianceResult {
  items: VarianceItem[];
  summary: VarianceSummary;
}

export const GET = withAuthApi<
  unknown,
  unknown,
  ResponseType<StockVarianceResult>,
  StockVarianceInput
>(async ({ db, userAuth, searchParams }) => {
  const { from, to } = varianceInput.parse(searchParams ?? {});
  const currency = await db
    .table("setting")
    .where("option", "CURRENCY")
    .first<{ value: string } | undefined>();

  const result = await new StockVarianceService(db, userAuth.admin!).report({
    from,
    to,
    currencyCode: currency?.value,
  });
  return NextResponse.json({ success: true, result }, { status: 200 });
});
