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
    const specific = await db
      .table("product_discount")
      .whereIn("product_id", keys);
    const all = await db.table("product_discount").where("is_applied_all", 1);
    const category = await db
      .table("product_discount")
      .distinct(
        "product_discount.*",
        "product_categories.product_id as product_c_id"
      )
      .innerJoin(
        "product_categories",
        "product_discount.category_id",
        "product_categories.category_id"
      )
      .whereIn("product_categories.product_id", keys);

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
            return {
              productId: item.product_id,
              discountId: item.discount_id,
              discount: item.discount_id
                ? await discountLoader.load(item.discount_id)
                : null,
              product: await productLoader.load(item.product_id),
              productVariants: await productVariantLoader.load(item.product_id),
              isAppliedAll: item.is_applied_all === 1,
              category: item.category_id
                ? await categoryLoader.load(item.category_id)
                : null,
            };
          })
        );
      })
    );
  });
}
