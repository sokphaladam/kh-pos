import ProductImageRepository, {
  ProductImage,
} from "@/repository/product-image-repository";
import Dataloader from "dataloader";
import { Knex } from "knex";

export function createProductImageLoader(db: Knex) {
  return new Dataloader(async (keys: readonly string[]) => {
    const rows = await new ProductImageRepository(db).findByProductIds(keys);
    const images = rows.map(ProductImageRepository.map);
    const productImageMap: Record<string, ProductImage[]> = {};
    images.forEach((row) => {
      if (productImageMap[row.productId]) {
        productImageMap[row.productId].push(row);
      } else {
        productImageMap[row.productId] = [row];
      }
    });
    return keys.map((key) => productImageMap[key] || []);
  });
}
