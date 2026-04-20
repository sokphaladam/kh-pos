import {
  ReplenishmentService,
  replenishmentUpdateSchema,
  ReplenishmentUpdateType,
} from "@/classes/replenishment";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

export const updateReplenishment = withAuthApi<
  unknown,
  ReplenishmentUpdateType,
  ResponseType<boolean>
>(async ({ db, userAuth, body }) => {
  const input = replenishmentUpdateSchema.parse(body);

  const replenishmentService = new ReplenishmentService(db, userAuth.admin!);
  const result = await replenishmentService.updateReplenishment(input);

  return NextResponse.json(
    {
      success: true,
      result,
    },
    { status: 200 }
  );
});
