import {
  ReplenishmentService,
  ReplenishmentSuggestionByWarehouse,
} from "@/classes/replenishment";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const suggestionSchem = z.object({
  fromWarehouseId: z.string(),
});

export const getSuggestion = withAuthApi<
  unknown,
  unknown,
  ResponseType<ReplenishmentSuggestionByWarehouse[]>
>(async ({ db, userAuth, searchParams }) => {
  const param = suggestionSchem.parse(searchParams);
  const result = await new ReplenishmentService(db, userAuth.admin!).suggestion(
    param.fromWarehouseId
  );

  return NextResponse.json(
    {
      success: true,
      result,
    },
    { status: 200 }
  );
});
