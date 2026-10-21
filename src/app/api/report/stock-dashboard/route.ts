import { StockDashboard, StockDashboardService } from "@/classes/stock-dashboard";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const dashboardInput = z.object({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
});

export type StockDashboardInput = z.input<typeof dashboardInput>;

export const GET = withAuthApi<
  unknown,
  unknown,
  ResponseType<StockDashboard>,
  StockDashboardInput
>(async ({ db, userAuth, searchParams }) => {
  const { month } = dashboardInput.parse(searchParams ?? {});
  const currency = await db
    .table("setting")
    .where("option", "CURRENCY")
    .first<{ value: string } | undefined>();

  const result = await new StockDashboardService(
    db,
    userAuth.admin!,
  ).dashboard(month, currency?.value);
  return NextResponse.json({ success: true, result }, { status: 200 });
});
