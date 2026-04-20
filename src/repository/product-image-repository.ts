import { table_product_images } from "@/generated/tables";
import BaseRepository from "./base-repository";

export interface ProductImage {
  id: string | undefined;
  productId: string;
  url: string;
  productVariantId?: string | null;
  imageOrder: number | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export default class ProductImageRepository extends BaseRepository<table_product_images> {
  protected tableName: string = "product_images";
  protected idColumnName = "id";

  async findByProductIds(
    productIds: readonly string[]
  ): Promise<table_product_images[]> {
    return await this.tx(this.tableName).whereIn("product_id", productIds);
  }

  async findByVariantIds(
    variantIds: readonly string[]
  ): Promise<table_product_images[]> {
    return await this.tx(this.tableName).whereIn(
      "product_variant_id",
      variantIds
    );
  }

  static map(row: table_product_images): ProductImage {
    return {
      id: row.id,
      productId: row.product_id,
      url: row.image_url,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      imageOrder: row.image_order,
      productVariantId: row.product_variant_id,
    };
  }
}
