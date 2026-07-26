import { ProductWarehouseVisibilityService } from "@/classes/product-warehouse-visibility";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

export const PUT = withAuthApi<
  unknown,
  {
    productId: string;
    isTopSale?: boolean;
    isNew?: boolean;
    isMostOrder?: boolean;
  },
  ResponseType<unknown>
>(async ({ db, body, userAuth }) => {
  const { productId, isTopSale, isNew, isMostOrder } = body || {};

  const productWarehouseVisibilityService =
    new ProductWarehouseVisibilityService(db);

  await productWarehouseVisibilityService.setBadgesProductWarehouseVisibility(
    productId || "",
    userAuth.admin?.currentWarehouseId || "",
    { isTopSale, isNew, isMostOrder },
  );

  return NextResponse.json(
    {
      success: true,
      result: {
        productId,
        isTopSale,
        isNew,
        isMostOrder,
        warehouseId: userAuth.admin?.currentWarehouseId || "",
      },
    },
    { status: 200 },
  );
});
