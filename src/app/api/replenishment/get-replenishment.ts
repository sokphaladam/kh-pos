import {
  Replenishment,
  replenishmentFilterSchema,
  ReplenishmentFilterType,
  ReplenishmentService,
} from "@/classes/replenishment";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

export const getReplenishment = withAuthApi<
  unknown,
  unknown,
  ResponseType<{ total: number; data: Replenishment[] }>,
  ReplenishmentFilterType
>(async ({ db, searchParams, userAuth }) => {
  const params = replenishmentFilterSchema.parse(searchParams);

  const result = await new ReplenishmentService(
    db,
    userAuth.admin!
  ).getReplenishment(params);
  return NextResponse.json(
    {
      success: true,
      result,
    },
    { status: 200 }
  );
});
