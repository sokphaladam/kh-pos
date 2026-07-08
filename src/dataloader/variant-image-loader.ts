import ProductImageRepository, {
  ProductImage,
} from "@/repository/product-image-repository";
import DataLoader from "dataloader";
import { Knex } from "knex";
import { headers } from "next/headers";

export function createVariantImageLoader(db: Knex) {
  return new DataLoader(async (keys: readonly string[]) => {
    const rows = await new ProductImageRepository(db).findByVariantIds(keys);
    const headerList = await headers();
    const hostname = headerList.get("host")?.split(":")[0];
    const images = await Promise.all(
      rows.map((row) => ProductImageRepository.map(row, hostname))
    );
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
