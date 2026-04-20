import { Knex } from "knex";
import { ProductOptionAndVariant } from "./types";
import { ProductService } from "@/classes/product-service";
import { UserInfo } from "@/lib/server-functions/get-auth-from-token";

export async function updateProductOption(
  db: Knex,
  productId: string,
  input: ProductOptionAndVariant,
  user: UserInfo
): Promise<ProductOptionAndVariant> {
  await db.transaction(async (trx) => {
    const productService = new ProductService(trx, user);
    // handle product option
    for (const option of input.options) {
      await productService.updateProductOption(option);
    }

    // handle product variant
    // find deleted variant
    const toDeleteVariants = await trx
      .table("product_variant")
      .where("product_id", productId)
      .whereNotIn(
        "product_variant.id",
        input.variants.filter((v) => v.id).map((v) => v.id!)
      );
    for (const variant of toDeleteVariants) {
      await productService.deleteProductVariant(variant.id!);
    }

    for (const variant of input.variants) {
      await productService.updateProductVariant(variant, productId);
    }

    // handle product variant by warehouse
    // find deleted variant by warehouse
    const toDeleteVariantByWarehouse = await trx
      .table("product_variant_by_warehouse")
      .where("product_id", productId)
      .whereNotIn(
        "product_variant_by_warehouse.id",
        input.byWarehouse.filter((v) => v.id).map((v) => v.id)
      );
    for (const variantByWarehouse of toDeleteVariantByWarehouse) {
      await productService.deleteProductVariantByWarehouse(
        variantByWarehouse.id
      );
    }
    for (const variantByWarehouse of input.byWarehouse) {
      await productService.updateProductVariantByWarehouse(
        productId,
        variantByWarehouse
      );
    }
  });

  return input;
}
