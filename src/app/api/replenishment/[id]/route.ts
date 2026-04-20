import { FindProductInSlotResult } from "@/classes/find-product-in-slot";
import {
  Replenishment,
  ReplenishmentDetail,
  ReplenishmentService,
} from "@/classes/replenishment";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

export const GET = withAuthApi<
  { id: string },
  unknown,
  ResponseType<{
    replenishmentInfo: Replenishment;
    replenishmentDetails: ReplenishmentDetail[];
    replenishmentPickingList?: FindProductInSlotResult[];
  }>
>(async ({ db, userAuth, params }) => {
  if (!params?.id) {
    return NextResponse.json(
      { success: false, message: "Replenishment not found" },
      { status: 404 }
    );
  }

  const result = await new ReplenishmentService(
    db,
    userAuth.admin!
  ).getReplenishmentDetail(params.id);

  return NextResponse.json({
    success: true,
    result,
  });
});
