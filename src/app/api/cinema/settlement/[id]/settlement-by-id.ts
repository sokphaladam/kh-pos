import {
  ProducerSettlement,
  SettlementService,
} from "@/classes/cinema/settlement";
import { Showtime } from "@/classes/cinema/showtime";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

export const settlementById = withAuthApi<
  { id: string },
  unknown,
  ResponseType<ProducerSettlement & { showtimes: Showtime[] }>
>(async ({ db, params, userAuth }) => {
  const settlementService = new SettlementService(db);
  const result = await settlementService.getSettlementDetails(
    params?.id || "",
    userAuth.admin!,
  );

  return NextResponse.json(
    {
      success: true,
      result,
    },
    { status: 200 },
  );
});
