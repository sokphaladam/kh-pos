import { ReplenishmentService } from "@/classes/replenishment";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const inputParamSchema = z.object({
  id: z.string(),
});

export const PUT = withAuthApi<
  { id: string },
  unknown,
  ResponseType<boolean>,
  unknown
>(async ({ db, userAuth, params }) => {
  const input = inputParamSchema.parse(params);
  const replenishmentId = input.id;

  const replenishmentService = new ReplenishmentService(db, userAuth.admin!);
  const result = await replenishmentService.approveReplenishment(
    replenishmentId
  );

  return NextResponse.json(
    {
      success: true,
      result,
    },
    { status: 200 }
  );
});
