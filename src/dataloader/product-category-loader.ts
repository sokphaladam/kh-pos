import ProductCategoryRepository from "@/repository/product-category-repository";
import Dataloader from "dataloader";
import { Knex } from "knex";

export function createProductCategoryLoader(db: Knex) {
  return new Dataloader(async (keys: readonly string[]) => {
    const rows = await new ProductCategoryRepository(db).findByIds(keys);
    const categories = rows.map((row) => ProductCategoryRepository.map(row!));

    return keys.map((key) => {
      const category = categories.find((c) => c.id === key);
      return category || null;
    });
  });
}
