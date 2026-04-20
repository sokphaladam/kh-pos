import { ProductService } from "@/classes/product-service";
import withDatabaseApi from "@/lib/server-functions/with-database-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import {
  ProductSearchFilter,
  productSearchFilterSchema,
  ProductSearchResult,
} from "../../product/search-product/types";

export const getMenu = withDatabaseApi<
  unknown,
  unknown,
  ResponseType<ProductSearchResult[]>,
  ProductSearchFilter
>(async ({ db, searchParams }) => {
  const result = await db.transaction(async (trx) => {
    const productService = new ProductService(trx);

    const filter = productSearchFilterSchema.parse(searchParams);
    return await productService.searchProduct({
      ...filter,
      limit: Number(filter.limit) || 10,
      offset: Number(filter.offset) || 0,
      replenishment: filter.replenishment === "true",
      categoryKeys: filter.categoryKeys
        ? filter.categoryKeys?.split(",")
        : undefined,
      includeProductNotForSale: filter.includeProductNotForSale === "true",
    });
  });
  return NextResponse.json({ success: true, result }, { status: 200 });
});
