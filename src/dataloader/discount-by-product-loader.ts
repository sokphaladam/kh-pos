import DataLoader from "dataloader";
import { Knex } from "knex";
import { LoaderFactory } from "./loader-factory";
import { ProductCategory } from "@/repository/product-category-repository";
import { ProductVariantType } from "./product-variant-loader";
import { BasicProductType } from "./basic-product-loader";
import { UserInfo } from "@/lib/server-functions/get-auth-from-token";
import { Warehouse } from "./warehouse-loader";

export interface DiscountByProduct {
  productId: string;
  discountId: string | null;
  discount: {
    id: string;
    title: string;
    description: string;
    discountType: "AMOUNT" | "PERCENTAGE" | undefined;
    value: number;
    warehouseId: string | null;
    createdAt: string | null;
    createdBy: UserInfo | null;
    updatedAt: string | null;
    updatedBy: UserInfo | null;
    warehouse: Warehouse | null;
  } | null;
  product: BasicProductType | null;
  productVariants: ProductVariantType[] | null;
  isAppliedAll: boolean;
  category: ProductCategory | null;
}

export function createDiscountByProductLoader(
  db: Knex,
  warehouseId: string
): DataLoader<string, DiscountByProduct[]> {
  return new DataLoader(async (keys: readonly string[]) => {
    const [specific, all, productCategories] = await Promise.all([
      db.table("product_discount").whereIn("product_id", keys),
      db.table("product_discount").where("is_applied_all", 1),
      db
        .table("product_categories")
        .whereIn("product_id", keys)
        .distinct("product_id", "category_id"),
    ]);

    const categoryIds = [
      ...new Set(productCategories.map((pc) => pc.category_id)),
    ];
    const categoryDiscounts =
      categoryIds.length > 0
        ? await db.table("product_discount").whereIn("category_id", categoryIds)
        : [];

    // Discounts reached through each product's categories. product_categories
    // pairs are distinct, so each discount row appears once per product, same
    // as the previous DISTINCT over the join.
    const category = productCategories.flatMap((pc) =>
      categoryDiscounts
        .filter((d) => d.category_id === pc.category_id)
        .map((d) => ({ ...d, product_c_id: pc.product_id })),
    );

    const productLoader = LoaderFactory.basicProductLoader(db);
    const productVariantLoader = LoaderFactory.productVariantLoader(
      db,
      warehouseId
    );
    const categoryLoader = LoaderFactory.productCategoryLoader(db);
    const discountLoader = LoaderFactory.discountLoader(db);

    return Promise.all(
      keys.map(async (key) => {
        let result = all;
        result = [...result, ...specific.filter((s) => s.product_id === key)];
        result = [...result, ...category.filter((c) => c.product_c_id === key)];

        return Promise.all(
          result.map(async (item) => {
            const [discount, product, productVariants, category] =
              await Promise.all([
                item.discount_id ? discountLoader.load(item.discount_id) : null,
                productLoader.load(item.product_id),
                productVariantLoader.load(item.product_id),
                item.category_id ? categoryLoader.load(item.category_id) : null,
              ]);
            return {
              productId: item.product_id,
              discountId: item.discount_id,
              discount,
              product,
              productVariants,
              isAppliedAll: item.is_applied_all === 1,
              category,
            };
          })
        );
      })
    );
  });
}
