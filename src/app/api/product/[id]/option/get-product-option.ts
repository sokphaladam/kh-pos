import { Knex } from "knex";
import { ProductOptionAndVariant } from "./types";
import { ProductService } from "@/classes/product-service";
import { UserInfo } from "@/lib/server-functions/get-auth-from-token";

export async function getProductOption(
  db: Knex,
  productId: string,
  user: UserInfo
): Promise<ProductOptionAndVariant> {
  return await db.transaction(async (trx) => {
    const productService = new ProductService(trx, user);
    const productOption = await productService.getProductOption(productId);
    const productVariant = await productService.getProductVariant(productId);
    const productVariantByWarehouse =
      await productService.getProductVariantByWarehouse(productId);
    return {
      options: productOption,
      variants: productVariant,
      byWarehouse: productVariantByWarehouse,
    };
  });
}
