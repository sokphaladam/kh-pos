import { table_product_category } from "@/generated/tables";
import BaseRepository from "./base-repository";

export interface ProductCategory {
  id: string | undefined;
  categoryId?: string | undefined;
  title: string;
  description: string | null;
  parentId: string | null;
  imageUrl?: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  sortOrder?: number | undefined;
  excludeFeeDelivery?: boolean | undefined;
  markExtraFee?: number | undefined;
}

export default class ProductCategoryRepository extends BaseRepository<table_product_category> {
  protected tableName: string = "product_category";
  protected idColumnName = "id";

  async findByProductIds(
    productIds: readonly string[],
  ): Promise<(table_product_category & { product_id?: string })[]> {
    return await this.tx("product_categories")
      .innerJoin("product_category", {
        "product_categories.category_id": "product_category.id",
      })
      .whereIn("product_id", productIds)
      .select("product_category.*", "product_categories.product_id");
  }

  static map(row: table_product_category): ProductCategory {
    return {
      id: row.id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      title: row.title,
      description: row.description,
      parentId: row.parent_id,
      imageUrl: row.image_url,
      excludeFeeDelivery: Boolean(row.exclude_fee_delivery),
      markExtraFee:
        row.mark_extra_fee !== null ? Number(row.mark_extra_fee) : undefined,
      sortOrder: row.sort_order !== null ? Number(row.sort_order) : undefined,
    };
  }
}
