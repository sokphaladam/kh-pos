import { SettlementService } from "@/classes/cinema/settlement";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

export const setSettlement = withAuthApi<
  unknown,
  {
    settlementId: string;
    proofLink: string;
  },
  ResponseType<unknown>
>(async ({ db, userAuth, body }) => {
  const { settlementId, proofLink } = body!;
  const settlementService = new SettlementService(db);

  const result = await settlementService.settleProducerSettlement(
    { settlementId, proofLink },
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
