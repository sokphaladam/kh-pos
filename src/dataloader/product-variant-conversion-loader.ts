import { ProductVariantConversionType } from "@/classes/product-variant-conversion";
import DataLoader from "dataloader";
import { Knex } from "knex";
import { groupBy } from "lodash";
import { LoaderFactory } from "./loader-factory";

export function createProductVariantConversionLoader(
  db: Knex,
  warehouseId: string
) {
  return new DataLoader<string, ProductVariantConversionType[]>(
    async (keys) => {
      const rows = await db("product_variant_conversion")
        .whereIn("product_id", keys)
        .select("*");

      const variantLoader = LoaderFactory.productVariantByIdLoader(
        db,
        warehouseId
      );

      const conversions: ProductVariantConversionType[] = await Promise.all(
        rows.map(async (row) => {
          return {
            fromVariant: await variantLoader.load(row.from_variant_id),
            toVariant: await variantLoader.load(row.to_variant_id),
            productId: row.product_id,
            conversionRate: row.conversion_rate,
          };
        })
      );

      const grouped = groupBy(conversions, "productId");
      return keys.map((key) => grouped[key] || []);
    }
  );
}
