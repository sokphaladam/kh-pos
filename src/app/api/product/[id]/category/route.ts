import withAuthApi from "@/lib/server-functions/with-auth-api";
import {
  ProductCategoryDetail,
  productCategoryInputArraySchema,
  ProductCategoryUpdate,
} from "./types";
import { NextResponse } from "next/server";
import { ResponseType } from "@/lib/types";
import { updateProductCategory } from "./update-product-category";
import { ProductService } from "@/classes/product-service";

export const GET = withAuthApi<
  unknown,
  unknown,
  ResponseType<ProductCategoryDetail[]>
>(async ({ db, req, userAuth }) => {
  const pathname = req.nextUrl.pathname.split("/");
  const productId = pathname[pathname.indexOf("product") + 1];
  if (!productId) {
    return NextResponse.json(
      { success: false, error: "Missing product ID" },
      { status: 400 }
    );
  }

  const result = await db.transaction(async (trx) => {
    return new ProductService(trx, userAuth.admin!).getProductCategories(
      productId
    );
  });
  const filteredResult = result.filter((category) => category !== null);
  return NextResponse.json(
    { success: true, result: filteredResult },
    { status: 200 }
  );
});

export const PUT = withAuthApi<
  unknown,
  ProductCategoryUpdate[],
  ResponseType<ProductCategoryDetail[]>
>(async ({ db, req, body }) => {
  const input = productCategoryInputArraySchema.parse(
    body
  ) as ProductCategoryUpdate[];
  const pathname = req.nextUrl.pathname.split("/");
  const productId = pathname[pathname.indexOf("product") + 1];
  if (!productId) {
    return NextResponse.json(
      { success: false, error: "Missing product ID" },
      { status: 400 }
    );
  }

  const result = await updateProductCategory(db, input, productId);
  return NextResponse.json(
    {
      success: true,
      result,
    },
    { status: 200 }
  );
});
