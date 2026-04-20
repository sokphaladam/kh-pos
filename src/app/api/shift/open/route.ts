import { ShiftService } from "@/classes/shift";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const inputSchema = z.object({
  openedCashUsd: z.number(),
  openedCashKhr: z.number(),
  exchangeRate: z.number(),
});

export const POST = withAuthApi<unknown, unknown, ResponseType<string>>(
  async ({ db, body, userAuth }) => {
    const { openedCashUsd, openedCashKhr, exchangeRate } =
      inputSchema.parse(body);
    const shiftId = await new ShiftService(db).openShift(
      userAuth.admin!.id,
      openedCashUsd,
      openedCashKhr,
      exchangeRate
    );
    return NextResponse.json(
      { success: true, result: shiftId },
      { status: 200 }
    );
  }
);
