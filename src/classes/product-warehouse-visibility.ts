import { Formatter } from "@/lib/formatter";
import { generateId } from "@/lib/generate-id";
import { Knex } from "knex";
import z from "zod";

export const ProductWarehouseVisibilitySchema = z.object({
  warehouseId: z.string(),
  productId: z.string(),
  productVariantId: z.string(),
  isVisible: z.boolean().default(true),
  isForSale: z.boolean().default(true),
});

export type ProductWarehouseVisibility = z.infer<
  typeof ProductWarehouseVisibilitySchema
>;

export class ProductWarehouseVisibilityService {
  constructor(protected knex: Knex) {}

  async setProductWarehouseVisibility(input: ProductWarehouseVisibility[]) {
    const insertData = input.map((item) => ({
      warehouse_id: item.warehouseId,
      product_id: item.productId,
      product_variant_id: item.productVariantId,
      is_visible: item.isVisible,
      is_for_sale: item.isForSale,
      id: generateId(),
      created_at: Formatter.getNowDateTime(),
      updated_at: Formatter.getNowDateTime(),
    }));

    await this.knex
      .table("product_warehouse_visibility")
      .insert(insertData)
      .onConflict(["warehouse_id", "product_id", "product_variant_id"])
      .merge();

    return true;
  }

  async removeProductWarehouseVisibility(
    input: {
      warehouseId: string;
      productId: string;
      productVariantId: string;
    }[],
  ) {
    this.knex.transaction(async (trx) => {
      for (const item of input) {
        await trx
          .table("product_warehouse_visibility")
          .where({
            warehouse_id: item.warehouseId,
            product_id: item.productId,
            product_variant_id: item.productVariantId,
          })
          .delete();
      }
    });

    return true;
  }

  async setForSaleProductWarehouseVisibility(
    productId: string,
    warehouseId: string,
    isForSale: boolean,
  ) {
    await this.knex
      .table("product_warehouse_visibility")
      .where({
        warehouse_id: warehouseId,
        product_id: productId,
      })
      .update({
        is_for_sale: isForSale,
        updated_at: Formatter.getNowDateTime(),
      });

    return true;
  }

  async setVisibilityProductWarehouseVisibility(
    productVariantId: string,
    warehouseId: string,
    isVisible: boolean,
  ) {
    await this.knex
      .table("product_warehouse_visibility")
      .where({
        warehouse_id: warehouseId,
        product_variant_id: productVariantId,
      })
      .update({
        is_visible: isVisible,
        updated_at: Formatter.getNowDateTime(),
      });

    return true;
  }
}
