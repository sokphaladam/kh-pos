import { NextResponse } from "next/server";
import withAuthApi from "../../../lib/server-functions/with-auth-api";
import { z } from "zod";
import { ProductServiceV2 } from "@/classes/product-v2";

const productListInput = z.object({
  id: z.string().optional(),
  limit: z.string().default("30"),
  offset: z.string().default("0"),
  searchTitle: z.string().optional(),
  supplierId: z.string().optional(),
  barcode: z.string().optional(),
  categoryId: z.string().optional(),
});

export type ProductListInput = z.infer<typeof productListInput>;

export const getProductList = withAuthApi<
  unknown,
  unknown,
  unknown,
  ProductListInput
>(async ({ db, userAuth, searchParams }) => {
  const { id, limit, offset, searchTitle, supplierId, barcode, categoryId } =
    productListInput.parse(searchParams);

  const productService = new ProductServiceV2(db, userAuth.admin!);
  const { data, total } = await productService.mainProductList({
    id,
    limit: Number(limit),
    offset: Number(offset),
    searchTitle,
    supplierId,
    barcode,
    categoryId,
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
