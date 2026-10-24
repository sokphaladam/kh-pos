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
    isNotAvailable?: boolean | null;
  },
  ResponseType<unknown>
>(async ({ db, body, userAuth }) => {
  const { productVariantId, isPopular, isNew, isMostOrder, isNotAvailable } = body || {};

  const productWarehouseVisibilityService =
    new ProductWarehouseVisibilityService(db);

  await productWarehouseVisibilityService.setBadgesProductWarehouseVisibility(
    productVariantId || "",
    userAuth.admin?.currentWarehouseId || "",
    { isPopular, isNew, isMostOrder, isNotAvailable },
  );

  return NextResponse.json(
    {
      success: true,
      result: {
        productVariantId,
        isPopular,
        isNew,
        isMostOrder,
        isNotAvailable,
        warehouseId: userAuth.admin?.currentWarehouseId || "",
      },
    },
    { status: 200 },
  );
});
