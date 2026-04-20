import { LoaderFactory } from "@/dataloader/loader-factory";
import { table_product_images } from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import { UserInfo } from "@/lib/server-functions/get-auth-from-token";
import { Knex } from "knex";
import { z } from "zod";

export const inputProductImageSchema = z
  .array(
    z.object({
      id: z.string().optional(),
      url: z.string(),
      productVariantId: z.string().optional(),
      imageOrder: z.number(),
    })
  )
  .default([]);
export type ProductImageUpdateInput = z.infer<typeof inputProductImageSchema>;

export class ProductImageService {
  constructor(
    protected trx: Knex,
    protected user: UserInfo,
    protected productId: string
  ) {}

  async getProductImages() {
    const imageLoader = LoaderFactory.productImageLoader(this.trx);
    return await imageLoader.load(this.productId);
  }

  async updateProductImages(input: ProductImageUpdateInput) {
    const now = Formatter.getNowDateTime();
    await this.trx.transaction(async (trx) => {
      // find image that are not in the input and delete
      const toDelete: table_product_images[] = await trx
        .table<table_product_images>("product_images")
        .whereNotIn(
          "id",
          input.filter((i) => i.id).map((i) => i.id)
        )
        .andWhere("product_id", this.productId);
      for (const i of toDelete) {
        await trx
          .table<table_product_images>("product_images")
          .where({ id: i.id, product_id: this.productId })
          .delete();

        // log user action
      }

      for (const image of input) {
        await trx
          .table<table_product_images>("product_images")
          .insert({
            id: image.id,
            product_id: this.productId,
            image_url: image.url,
            image_order: image.imageOrder,
            product_variant_id: image.productVariantId,
            created_at: now,
          })
          .onConflict(["id"])
          .merge();

        // log user action
      }
    });
  }
}
