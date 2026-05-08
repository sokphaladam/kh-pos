import { ProductWarehouseVisibilityService } from "@/classes/product-warehouse-visibility";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

export const PUT = withAuthApi<
  unknown,
  { productVariantId: string; isVisible: boolean },
  ResponseType<unknown>
>(async ({ db, body, userAuth }) => {
  const { productVariantId, isVisible } = body || {};

  const productWarehouseVisibilityService =
    new ProductWarehouseVisibilityService(db);

  await productWarehouseVisibilityService.setVisibilityProductWarehouseVisibility(
    productVariantId || "",
    userAuth.admin?.currentWarehouseId || "",
    isVisible === true,
  );

  return NextResponse.json(
    {
      success: true,
      result: {
        productVariantId,
        isVisible,
        warehouseId: userAuth.admin?.currentWarehouseId || "",
      },
    },
    { status: 200 },
  );
});
