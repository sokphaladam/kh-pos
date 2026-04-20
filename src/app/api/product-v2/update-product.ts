import {
  inputProductCategoriesSchema,
  ProductCategory,
} from "@/classes/product-category";
import {
  inputProductImageSchema,
  ProductImageService,
} from "@/classes/product-image";
import {
  inputProductOptionsSchema,
  ProductOptionService,
} from "@/classes/product-options";
import {
  inputProductBasicSchema,
  ProductServiceV2,
} from "@/classes/product-v2";
import {
  inputProductVariantsSchema,
  ProductVariantService,
} from "@/classes/product-variant";
import {
  inputProductConversionSchema,
  ProductVariantConversion,
} from "@/classes/product-variant-conversion";
import { MovieService } from "@/classes/movie";
import { UserInfo } from "@/lib/server-functions/get-auth-from-token";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { Knex } from "knex";
import { NextResponse } from "next/server";
import { z } from "zod";
import { inputMovieSchema } from "./create-product";

const inputUpdateProductSchema = z.object({
  productId: z.string().nonempty(),
  productBasic: inputProductBasicSchema,
  productCategories: inputProductCategoriesSchema,
  productImages: inputProductImageSchema,
  productOption: inputProductOptionsSchema,
  productVariants: inputProductVariantsSchema,
  productConversions: inputProductConversionSchema,
  productMovies: inputMovieSchema.optional(),
});

export type UpdateProductInput = z.infer<typeof inputUpdateProductSchema>;

async function handleProductUpdates(
  trx: Knex,
  user: UserInfo,
  input: UpdateProductInput
) {
  const {
    productId,
    productBasic,
    productCategories,
    productImages,
    productOption,
    productVariants,
    productConversions,
    productMovies,
  } = input;

  // product basic
  const productService = new ProductServiceV2(trx, user);
  await productService.updateProduct(productBasic, productId);

  // product category
  const productCategory = new ProductCategory(trx, user, productId);
  await productCategory.updateProductCategories(productCategories || []);

  // product image
  const imageService = new ProductImageService(trx, user, productId);
  await imageService.updateProductImages(productImages || []);

  // product option
  const productOptionService = new ProductOptionService(trx, user, productId);
  await productOptionService.updateProductOptions(productOption || []);

  // product variant
  const productVariantService = new ProductVariantService(trx, user, productId);
  await productVariantService.updateProductVariants(productVariants);

  // product conversions
  const productConversionService = new ProductVariantConversion(trx, user);
  await productConversionService.addProductVariantConversion(
    productConversions || [],
    productId
  );

  // product movies - single movie, update or create
  if (productMovies) {
    const movieService = new MovieService(trx, user);
    // Check if movie exists
    const existingMovie = await movieService.getMovieByVariantId(
      productMovies.variantId
    );

    if (existingMovie) {
      await movieService.updateMovie(productMovies);
    } else {
      await movieService.createMovie(productMovies);
    }
  }

  await productVariantService.triggerVariant(productId);
}

export const updateProduct = withAuthApi<
  unknown,
  UpdateProductInput,
  unknown,
  ResponseType<boolean>
>(async ({ db, userAuth, body }) => {
  return await db.transaction(async (trx) => {
    const input = inputUpdateProductSchema.parse(body);
    await handleProductUpdates(trx, userAuth.admin!, input);

    return NextResponse.json(
      {
        success: true,
        result: input.productId,
      },
      { status: 200 }
    );
  });
});
