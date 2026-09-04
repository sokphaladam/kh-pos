import { ProductWarehouseVisibilityService } from "@/classes/product-warehouse-visibility";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

export const PUT = withAuthApi<
  unknown,
  {
    productVariantId: string;
    isPopular?: boolean | null;
    isNew?: boolean | null;
    isMostOrder?: boolean | null;
  },
  ResponseType<unknown>
>(async ({ db, body, userAuth }) => {
  const { productVariantId, isPopular, isNew, isMostOrder } = body || {};

  const productWarehouseVisibilityService =
    new ProductWarehouseVisibilityService(db);

  await productWarehouseVisibilityService.setBadgesProductWarehouseVisibility(
    productVariantId || "",
    userAuth.admin?.currentWarehouseId || "",
    { isPopular, isNew, isMostOrder },
  );

  return NextResponse.json(
    {
      success: true,
      result: {
        productVariantId,
        isPopular,
        isNew,
        isMostOrder,
        warehouseId: userAuth.admin?.currentWarehouseId || "",
      },
    },
    { status: 200 },
  );
});
