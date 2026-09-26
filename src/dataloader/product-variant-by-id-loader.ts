import { table_product_variant } from "@/generated/tables";
import DataLoader from "dataloader";
import { Knex } from "knex";
import { LoaderFactory } from "./loader-factory";
import {
  getVariantOptionValue,
  ProductVariantType,
} from "./product-variant-loader";

export function createProductVariantByIdLoader(db: Knex, warehouseId?: string) {
  return new DataLoader(async (keys: readonly string[]) => {
    const rows: table_product_variant[] = await db("product_variant").whereIn(
      "id",
      keys,
    );

    let variantStockLoader: ReturnType<
      typeof LoaderFactory.variantStockLoader
    > | null = null;

    if (warehouseId) {
      variantStockLoader = LoaderFactory.variantStockLoader(db, warehouseId);
    }

    const basicProductLoader = LoaderFactory.basicProductLoader(db);

    const variantValue = await getVariantOptionValue(
      db,
      rows.map((x) => x.id!),
    );
    const movieLoader = LoaderFactory.movieByVariantIDLoader(db);

    const productVariants: ProductVariantType[] = await Promise.all(
      rows.map(async (x) => {
        const [variantStock, basicProduct, movie] = await Promise.all([
          x.id && variantStockLoader ? variantStockLoader.load(x.id) : null,
          basicProductLoader.load(x.product_id),
          x.id ? movieLoader.load(x.id) : null,
        ]);

        const optionValues = variantValue
          .filter((v) => v.product_variant_id === x.id)
          .map((val) => ({
            id: val.id,
            value: val.value,
          }));

        return {
          id: x.id || "",
          productId: x.product_id || "",
          name: x.name || "",
          sku: x.sku || "",
          barcode: x.barcode || "",
          price: x.price ? Number(x.price) : null,
          purchasePrice: x.purchased_cost ? Number(x.purchased_cost) : null,
          lowStockQty: x.low_stock_qty ? Number(x.low_stock_qty) : null,
          idealStockQty: x.ideal_stock_qty ? Number(x.ideal_stock_qty) : null,
          stock: variantStock?.stock || 0,
          createdAt: x.created_at || "",
          updatedAt: x.updated_at || "",
          optionValues,
          basicProduct,
          slotStock: variantStock?.slotStock || [],
          visible: x.visible ? Boolean(x.visible) : false,
          movie,
        };
      }),
    );

    const variantById = new Map(productVariants.map((v) => [v.id, v]));
    return keys.map((key) => variantById.get(key) || null);
  });
}

export function getVariantProperName(variant: ProductVariantType): string {
  return `${variant.basicProduct?.title}(${variant.name})`;
}
