import DataLoader from "dataloader";
import { ProductVariantType } from "./product-variant-loader";
import { groupBy } from "lodash";
import { table_variant_composite } from "@/generated/tables";
import { LoaderFactory } from "./loader-factory";
import { Knex } from "knex";

export interface CompositeVariant {
  id: string;
  componentVariant: ProductVariantType;
  qty?: number;
}

export function createCompositeVariantLoader(
  db: Knex,
  warehouseId: string
): DataLoader<string, CompositeVariant[]> {
  return new DataLoader(async (keys: readonly string[]) => {
    const variants: table_variant_composite[] = await db
      .table("variant_composite")
      .whereIn("variant_composite_id", keys)
      .where("deleted_at", null)
      .select("*");

    const groupedVariants = groupBy(variants, "variant_composite_id");
    const variantLoader = LoaderFactory.productVariantByIdLoader(
      db,
      warehouseId
    );
    return Promise.all(
      keys.map(async (key) => {
        const items = groupedVariants[key] || [];
        return Promise.all(
          items.map(
            async (variant) =>
              ({
                id: variant.id,
                componentVariant: await variantLoader.load(
                  variant.variant_component_id
                ),
                qty: variant.qty,
              } as CompositeVariant)
          )
        );
      })
    );
  });
}
