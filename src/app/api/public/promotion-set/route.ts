import { PromotionSetService } from "@/classes/promotion-set";
import { Formatter } from "@/lib/formatter";
import {
  isPromotionSetActive,
  PromotionSetDefinition,
} from "@/lib/promotion-set";
import withDatabaseApi from "@/lib/server-functions/with-database-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

/**
 * Public, read-only: promotion sets running right now at a branch, for the
 * customer menu (`/menu`). SELECT queries only.
 */
export const GET = withDatabaseApi<
  unknown,
  unknown,
  ResponseType<PromotionSetDefinition[]>,
  { warehouse?: string }
>(async ({ db, req, searchParams }) => {
  const warehouseId = searchParams?.warehouse;
  if (!warehouseId) {
    return NextResponse.json(
      { success: false, error: "warehouse is required" },
      { status: 400 },
    );
  }

  const now = Formatter.getNowDateTime();
  const result = await PromotionSetService.withDisplayImages(
    (await new PromotionSetService(db).getActive(warehouseId))
      .filter((p) => isPromotionSetActive(p, now))
      .sort((a, b) => b.priority - a.priority || a.title.localeCompare(b.title)),
    req.headers.get("host")?.split(":")[0],
  );

  return NextResponse.json({ success: true, result }, { status: 200 });
});
