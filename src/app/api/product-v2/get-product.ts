import { NextResponse } from "next/server";
import withAuthApi from "../../../lib/server-functions/with-auth-api";
import { z } from "zod";
import { ProductServiceV2 } from "@/classes/product-v2";
import {
  PRODUCT_SALE_STATUS_FILTERS,
  PRODUCT_STOCK_STATUS_FILTERS,
  PRODUCT_TYPE_FILTERS,
} from "@/lib/product-list-filters";

const productListInput = z.object({
  id: z.string().optional(),
  limit: z.string().default("30"),
  offset: z.string().default("0"),
  searchTitle: z.string().optional(),
  supplierId: z.string().optional(),
  barcode: z.string().optional(),
  categoryId: z.string().optional(),
  saleStatus: z.enum(PRODUCT_SALE_STATUS_FILTERS).optional(),
  productType: z.enum(PRODUCT_TYPE_FILTERS).optional(),
  stockStatus: z.enum(PRODUCT_STOCK_STATUS_FILTERS).optional(),
});

export type ProductListInput = z.infer<typeof productListInput>;

export const getProductList = withAuthApi<
  unknown,
  unknown,
  unknown,
  ProductListInput
>(async ({ db, userAuth, searchParams }) => {
  const {
    id,
    limit,
    offset,
    searchTitle,
    supplierId,
    barcode,
    categoryId,
    saleStatus,
    productType,
    stockStatus,
  } = productListInput.parse(searchParams);

  const productService = new ProductServiceV2(db, userAuth.admin!);
  const { data, total } = await productService.mainProductList({
    id,
    limit: Number(limit),
    offset: Number(offset),
    searchTitle,
    supplierId,
    barcode,
    categoryId,
    saleStatus,
    productType,
    stockStatus,
  });
  return NextResponse.json(
    {
      success: true,
      result: {
        data,
        total,
      },
    },
    { status: 200 },
  );
});
