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
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

export const inputMovieSchema = z.object({
  variantId: z.string(),
  durationMinutes: z.number(),
  rating: z.string(),
  genre: z.array(z.string()),
  releaseDate: z.string(),
  posterUrl: z.string().nullable().optional(),
  trailerUrl: z.string().nullable().optional(),
  director: z.string().nullable().optional(),
  cast: z.array(z.string()).optional(),
  synopsis: z.string().nullable().optional(),
  emailProducer: z.array(z.string()).optional(),
  producerShare: z.number().optional(),
  taxRate: z.number().optional(),
});

export const productInputSchema = z.object({
  productId: z.string().optional(),
  productBasic: inputProductBasicSchema,
  productCategories: inputProductCategoriesSchema,
  productImages: inputProductImageSchema,
  productOption: inputProductOptionsSchema,
  productVariants: inputProductVariantsSchema,
  productConversions: inputProductConversionSchema,
  productMovies: inputMovieSchema.optional(),
});

export type ProductInput = z.infer<typeof productInputSchema>;

export const createProduct = withAuthApi<
  unknown,
  ProductInput,
  unknown,
  ResponseType<string>
>(async ({ db, body, userAuth }) => {
  const user = userAuth.admin!;
  return await db.transaction(async (trx) => {
    // product basic
    const input = productInputSchema.parse(body);
    const { productBasic } = input;
    const productService = new ProductServiceV2(trx, user);
    const productId = await productService.createProduct(
      productBasic,
      input.productId,
    );

    // product category
    const productCategory = new ProductCategory(trx, user, productId);
    await productCategory.updateProductCategories(
      input.productCategories || [],
    );

    // product image
    const imageService = new ProductImageService(trx, user, productId);
    await imageService.updateProductImages(input.productImages || []);

    // product option
    const productOptionService = new ProductOptionService(trx, user, productId);
    await productOptionService.createProductOptions(input.productOption || []);

    // product variant
    const productVariantService = new ProductVariantService(
      trx,
      user,
      productId,
    );
    for (const variant of input.productVariants) {
      await productVariantService.createProductVariant(variant);
    }

    // product conversions
    const productConversionService = new ProductVariantConversion(trx, user);
    await productConversionService.addProductVariantConversion(
      input.productConversions || [],
      productId,
    );

    // product movies - single movie per product
    if (input.productMovies) {
      const movieService = new MovieService(trx, user);
      await movieService.createMovie(input.productMovies);
    }

    await productVariantService.triggerVariant(productId);

    return NextResponse.json(
      {
        success: true,
        result: productId,
      },
      { status: 200 },
    );
  });
});
