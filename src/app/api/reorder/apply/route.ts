import { applyReorderLevelsSchema, ReorderService } from "@/classes/reorder";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

export type ApplyReorderLevelsBody = z.infer<typeof applyReorderLevelsSchema>;

export const POST = withAuthApi<
  unknown,
  ApplyReorderLevelsBody,
  ResponseType<number>
>(async ({ db, body, userAuth, logger }) => {
  const { items } = applyReorderLevelsSchema.parse(body);
  try {
    const result = await new ReorderService(db, userAuth.admin!).applyLevels(
      items,
    );
    logger.serverLog("reorder:apply-levels", {
      action: "update",
      table_name: "product_variant",
      key: items.map((i) => i.variantId).join(","),
      content: { items },
    });
    return NextResponse.json({ success: true, result }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 400 },
    );
  }
});
