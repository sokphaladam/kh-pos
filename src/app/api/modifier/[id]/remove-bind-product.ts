import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

export const removeBindProduct = withAuthApi<
  { id: string },
  { productId: string },
  ResponseType<boolean>
>(async ({ db, params, body }) => {
  const id = params?.id;
  const productId = body?.productId;

  if (!id || !productId) {
    return NextResponse.json(
      { success: false, error: "Missing parameters" },
      { status: 400 }
    );
  }

  await db
    .table("product_modifier")
    .where({ product_id: productId, modifier_id: id })
    .delete();

  return NextResponse.json({ success: true, result: true }, { status: 200 });
});
