import { SettlementService } from "@/classes/cinema/settlement";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

export const generateSettlement = withAuthApi<
  unknown,
  {
    startDate: string;
    endDate: string;
  },
  ResponseType<unknown>
>(async ({ db, userAuth, body }) => {
  const { startDate, endDate } = body!;
  const settlementService = new SettlementService(db);

  const result = await settlementService.generateSettlement(
    {
      startDate,
      endDate,
    },
    userAuth.admin!,
  );

  return NextResponse.json(
    {
      success: true,
      result,
    },
    {
      status: 200,
    },
  );
});
