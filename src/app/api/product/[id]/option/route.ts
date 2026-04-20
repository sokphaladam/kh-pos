import withAuthApi from "@/lib/server-functions/with-auth-api";
import { NextResponse } from "next/server";
import {
  ProductOptionAndVariant,
  productOptionAndVariantSchema,
} from "./types";
import { ResponseType } from "@/lib/types";
import { createProductOption } from "./create-product-option";
import { updateProductOption } from "./update-product-option";
import { getProductOption } from "./get-product-option";

export const GET = withAuthApi<
  unknown,
  unknown,
  ResponseType<ProductOptionAndVariant>
>(async ({ db, req, userAuth }) => {
  const pathname = req.nextUrl.pathname.split("/");
  const productId = pathname[pathname.indexOf("product") + 1];
  if (!productId) {
    return NextResponse.json(
      { success: false, error: "Missing product ID" },
      { status: 400 }
    );
  }
  const result = await getProductOption(db, productId, userAuth.admin!);

  return NextResponse.json(
    {
      success: true,
      result,
    },
    { status: 200 }
  );
});

export const POST = withAuthApi<
  unknown,
  ProductOptionAndVariant,
  ResponseType<ProductOptionAndVariant>
>(async ({ db, req, body, userAuth }) => {
  const pathname = req.nextUrl.pathname.split("/");
  const productId = pathname[pathname.indexOf("product") + 1];
  if (!productId) {
    return NextResponse.json(
      { success: false, error: "Missing product ID" },
      { status: 400 }
    );
  }
  const optionInput = productOptionAndVariantSchema.parse(
    body
  ) as ProductOptionAndVariant;
  const result = await createProductOption(
    db,
    productId,
    optionInput,
    userAuth.admin!
  );
  return NextResponse.json(
    {
      success: true,
      result,
    },
    { status: 200 }
  );
});

export const PUT = withAuthApi<
  unknown,
  ProductOptionAndVariant,
  ResponseType<ProductOptionAndVariant>
>(async ({ db, req, body, userAuth }) => {
  const pathname = req.nextUrl.pathname.split("/");
  const productId = pathname[pathname.indexOf("product") + 1];
  if (!productId) {
    return NextResponse.json(
      { success: false, error: "Missing product ID" },
      { status: 400 }
    );
  }
  const optionInput = productOptionAndVariantSchema.parse(
    body
  ) as ProductOptionAndVariant;
  const result = await updateProductOption(
    db,
    productId,
    optionInput,
    userAuth.admin!
  );
  return NextResponse.json(
    {
      success: true,
      result,
    },
    { status: 200 }
  );
});
