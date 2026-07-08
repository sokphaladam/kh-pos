import ProductImageRepository, {
  ProductImage,
} from "@/repository/product-image-repository";
import Dataloader from "dataloader";
import { Knex } from "knex";
import { headers } from "next/headers";

export function createProductImageLoader(db: Knex) {
  return new Dataloader(async (keys: readonly string[]) => {
    const rows = await new ProductImageRepository(db).findByProductIds(keys);
    const headerList = await headers();
    const hostname = headerList.get("host")?.split(":")[0];
    const images = await Promise.all(
      rows.map((row) => ProductImageRepository.map(row, hostname))
    );
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
