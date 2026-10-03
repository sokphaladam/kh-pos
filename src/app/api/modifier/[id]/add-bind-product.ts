import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const input = z.object({ productId: z.string().min(1) });

export const addBindProduct = withAuthApi<
  { id: string },
  { productId: string },
  ResponseType<boolean>
>(async ({ db, params, body, logger }) => {
  const id = params?.id;
  const parsed = input.safeParse(body);

  if (!id || !parsed.success) {
    return NextResponse.json(
      { success: false, error: "Missing parameters" },
      { status: 400 },
    );
  }
  const { productId } = parsed.data;

  // Double clicks or two cashiers adding at once must not create duplicate
  // rows (the table has no unique key), which would show the product twice.
  const exists = await db
    .table("product_modifier")
    .where({ product_id: productId, modifier_id: id })
    .first();

  if (!exists) {
    await db
      .table("product_modifier")
      .insert({ product_id: productId, modifier_id: id });

    logger.serverLog("modifier:bind-product", {
      action: "create",
      table_name: "product_modifier",
      key: id,
      content: { modifierId: id, productId },
    });
  }

  return NextResponse.json({ success: true, result: true }, { status: 200 });
});
