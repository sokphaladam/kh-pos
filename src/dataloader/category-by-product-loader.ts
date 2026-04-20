import { Knex } from "knex";
import Dataloader from "dataloader";
import { table_product_categories } from "@/generated/tables";
import { ProductCategory } from "@/repository/product-category-repository";
import { LoaderFactory } from "./loader-factory";

export function createCategoryByProductLoader(db: Knex) {
  return new Dataloader(async (keys: readonly string[]) => {
    const rows: table_product_categories[] = await db("product_categories")
      .whereIn("product_id", keys)
      .select("category_id", "product_id", "id");

    const categoryMap: Record<string, ProductCategory[]> = {};
    const categoryLoader = LoaderFactory.productCategoryLoader(db);
    await Promise.all(
      rows.map(async (row) => {
        const category = await categoryLoader.load(row.category_id);
        if (categoryMap[row.product_id]) {
          categoryMap[row.product_id].push({
            ...category!,
            categoryId: category?.id || '',
            id: row.id || ''
          });
        } else {
          categoryMap[row.product_id] = [{
            ...category!,
            categoryId: category?.id || '',
            id: row.id || ''
          }];
        }
      })
    );

    return keys.map((key) => categoryMap[key] || []);
  });
}
