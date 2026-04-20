import {
  replenishmentDeleteSchema,
  ReplenishmentDeleteType,
  ReplenishmentService,
} from "@/classes/replenishment";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

export const deleteReplenishment = withAuthApi<
  unknown,
  unknown,
  ResponseType<boolean>,
  ReplenishmentDeleteType
>(async ({ db, userAuth, body }) => {
  const input = replenishmentDeleteSchema.parse(body);

  const service = new ReplenishmentService(db, userAuth.admin!);

  const success = await service.deleteReplenishment(input);

  return NextResponse.json(
    {
      success: success,
    },
    { status: 200 }
  );
});
