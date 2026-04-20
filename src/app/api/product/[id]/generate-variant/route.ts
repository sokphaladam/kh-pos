import withAuthApi from "@/lib/server-functions/with-auth-api";
import {
  ProductOption,
  productOptionSchema,
  ProductVariant,
} from "../option/types";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { generateVariant } from "./generate-product-variant";

export const POST = withAuthApi<
  unknown,
  ProductOption[],
  ResponseType<ProductVariant[]>
>(async ({ req, body }) => {
  const pathname = req.nextUrl.pathname.split("/");
  const productId = pathname[pathname.indexOf("product") + 1];
  if (!productId) {
    return NextResponse.json(
      { success: false, error: "Missing product ID" },
      { status: 400 }
    );
  }
  const optionInput = productOptionSchema.parse(body) as ProductOption[];
  // generate variant using product options
  const variants = generateVariant(optionInput);
  return NextResponse.json(
    {
      success: true,
      result: variants,
    },
    { status: 200 }
  );
});
