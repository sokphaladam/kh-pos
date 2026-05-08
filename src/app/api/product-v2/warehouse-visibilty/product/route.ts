import { ProductWarehouseVisibilityService } from "@/classes/product-warehouse-visibility";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

export const PUT = withAuthApi<
  unknown,
  { productId: string; isForSale: boolean },
  ResponseType<unknown>
>(async ({ db, body, userAuth }) => {
  const { productId, isForSale } = body || {};

  const productWarehouseVisibilityService =
    new ProductWarehouseVisibilityService(db);

  await productWarehouseVisibilityService.setForSaleProductWarehouseVisibility(
    productId || "",
    userAuth.admin?.currentWarehouseId || "",
    isForSale === true,
  );

  return NextResponse.json(
    {
      success: true,
      result: {
        productId,
        isForSale,
        warehouseId: userAuth.admin?.currentWarehouseId || "",
      },
    },
    { status: 200 },
  );
});
