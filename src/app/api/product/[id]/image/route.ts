import { LoaderFactory } from "@/dataloader/loader-factory";
import { createProductImage } from "@/lib/server-functions/product/product-image/create-product-image";
import {
  ProductUpdate,
  updateProductImage,
} from "@/lib/server-functions/product/product-image/update-product-image";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { ProductImage } from "@/repository/product-image-repository";
import { NextResponse } from "next/server";

import { z } from "zod";

export const GET = withAuthApi<unknown, unknown, ResponseType<ProductImage[]>>(
  async ({ db, req }) => {
    const imageLoader = LoaderFactory.productImageLoader(db);
    const pathname = req.nextUrl.pathname.split("/");
    const productId = pathname[pathname.indexOf("product") + 1];
    if (!productId) {
      return NextResponse.json(
        { success: false, error: "Missing product ID" },
        { status: 400 }
      );
    }
    const images = await imageLoader.load(productId);

    return NextResponse.json(
      {
        success: true,
        result: images,
      },
      { status: 200 }
    );
  }
);

export const POST = withAuthApi<
  unknown,
  ProductImage[],
  ResponseType<ProductImage[]>
>(async ({ db, body, req, logger }) => {
  const imageSchema = z.object({
    url: z.string().url(),
    productVariantId: z.string().optional(),
    imageOrder: z.number(),
  });
  const imagesSchema = z.array(imageSchema);
  const input = imagesSchema.parse(body);

  const pathname = req.nextUrl.pathname.split("/");
  const productId = pathname[pathname.indexOf("product") + 1];

  const result = await createProductImage(db, input, productId, logger);

  return result;
});

export const PUT = withAuthApi<
  unknown,
  ProductUpdate[],
  ResponseType<ProductImage[]>
>(async ({ db, req, body, logger }) => {
  const imageSchema = z.object({
    id: z.string().optional(),
    url: z.string().url(),
    productVariantId: z.string().optional(),
    imageOrder: z.number(),
    action: z.enum(["update", "create"]),
  });
  const imagesSchema = z.array(imageSchema);

  const input = imagesSchema.parse(body) as ProductUpdate[];
  const pathname = req.nextUrl.pathname.split("/");
  const productId = pathname[pathname.indexOf("product") + 1];

  const result = await updateProductImage(db, input, productId, logger);

  return result;
});
