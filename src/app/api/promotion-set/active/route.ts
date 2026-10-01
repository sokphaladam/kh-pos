import { PromotionSetService } from "@/classes/promotion-set";
import { PromotionSetDefinition } from "@/lib/promotion-set";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

/**
 * Promotion sets currently running for the user's branch. The restaurant POS
 * feeds these to the shared engine (src/lib/promotion-set.ts) so the cart
 * shows the same promotion discount the server will charge.
 */
export const GET = withAuthApi<
  unknown,
  unknown,
  ResponseType<PromotionSetDefinition[]>
>(async ({ db, req, userAuth }) => {
  const warehouseId =
    req.nextUrl.searchParams.get("warehouseId") ||
    userAuth.admin?.currentWarehouseId ||
    null;
  const result = await new PromotionSetService(db).getActive(warehouseId);
  return NextResponse.json({ success: true, result });
});
