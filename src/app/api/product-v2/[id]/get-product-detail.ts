import { ProductCategory } from "@/classes/product-category";
import { ProductImageService } from "@/classes/product-image";
import { ProductOption, ProductOptionService } from "@/classes/product-options";
import { BasicProduct, ProductServiceV2 } from "@/classes/product-v2";
import { ProductVariantService } from "@/classes/product-variant";
import {
  ProductVariantConversion,
  ProductVariantConversionType,
} from "@/classes/product-variant-conversion";
import { MovieService, MovieInput } from "@/classes/movie";
import { ProductVariantType } from "@/dataloader/product-variant-loader";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { ProductImage } from "@/repository/product-image-repository";
import { NextResponse } from "next/server";

export interface ProductDetail {
  basic: BasicProduct;
  images: ProductImage[];
  categories: ProductCategory[];
  options: ProductOption[];
  variants: ProductVariantType[];
  conversions: ProductVariantConversionType[];
  movies?: MovieInput; // Changed to single movie object instead of array
}

export const getProductDetail = withAuthApi<
  { id: string },
  unknown,
  ResponseType<ProductDetail>
>(async ({ db, userAuth, params }) => {
  const user = userAuth.admin!;
  const { id } = params ?? {};
  if (!id) {
    return NextResponse.json(
      { success: false, message: "Invalid product ID" },
      { status: 400 }
    );
  }

  const result = await db.transaction(async (trx) => {
    // get basic product info
    const basic = await new ProductServiceV2(trx, user).getBasicProductById(id);

    // get product images'
    const images = await new ProductImageService(
      trx,
      user,
      id
    ).getProductImages();

    // get product categories
    const categories = await new ProductCategory(
      trx,
      user,
      id
    ).getProductCategories();

    // get product options
    const options = await new ProductOptionService(
      trx,
      user,
      id
    ).getProductOption();

    // get product variants
    const variants = await new ProductVariantService(
      trx,
      user,
      id
    ).getProductVariants();

    const conversions = await new ProductVariantConversion(
      trx,
      user
    ).getProductVariantConversions(id);

    // get movie data - only one movie per product (first variant)
    let movie: MovieInput | null = null;
    const isMovieCategory = categories.find((category) => {
      if (!category.title) return false;
      return category.categoryId === "movies-category-id";
    });

    if (isMovieCategory && variants.length > 0) {
      const movieService = new MovieService(trx, user);
      const movieData = await movieService.getMovieByVariantId(variants[0].id);
      if (movieData) {
        movie = movieData;
      }
    }

    return {
      basic,
      images,
      categories,
      options,
      variants,
      conversions,
      movies: movie,
    } as unknown as ProductDetail;
  });

  return NextResponse.json(
    {
      success: true,
      result,
    },
    { status: 200 }
  );
});
