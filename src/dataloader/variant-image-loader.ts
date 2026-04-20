import ProductImageRepository, {
  ProductImage,
} from "@/repository/product-image-repository";
import DataLoader from "dataloader";
import { Knex } from "knex";

export function createVariantImageLoader(db: Knex) {
  return new DataLoader(async (keys: readonly string[]) => {
    const rows = await new ProductImageRepository(db).findByVariantIds(keys);
    const images = rows.map(ProductImageRepository.map);
    const variantImageMap: Record<string, ProductImage[]> = {};
    images.forEach((row) => {
      if (variantImageMap[row.productVariantId!]) {
        variantImageMap[row.productVariantId!].push(row);
      } else {
        variantImageMap[row.productVariantId!] = [row];
      }
    });
    return keys.map((key) => variantImageMap[key] || []);
  });
}
