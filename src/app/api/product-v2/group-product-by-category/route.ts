import { ProductServiceV2, ProductV2 } from "@/classes/product-v2";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

export const GET = withAuthApi<
  unknown,
  unknown,
  ResponseType<Record<string, ProductV2[]>>
>(async ({ db, userAuth }) => {
  const productService = new ProductServiceV2(db, userAuth.admin!);

  const product = await productService.groupProductByCategory();

  return NextResponse.json(
    {
      success: true,
      result: product,
    },
    { status: 200 }
  );
});
