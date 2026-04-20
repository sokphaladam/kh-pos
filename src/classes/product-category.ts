import { LoaderFactory } from "@/dataloader/loader-factory";
import { table_product_categories } from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import { generateId } from "@/lib/generate-id";
import { UserInfo } from "@/lib/server-functions/get-auth-from-token";
import { Knex } from "knex";
import { z } from "zod";

export const inputProductCategoriesSchema = z.array(
  z.object({
    id: z.string().optional(),
    categoryId: z.string(),
  })
);

export type CategoryUpdateInput = z.infer<typeof inputProductCategoriesSchema>;

export class ProductCategory {
  constructor(
    protected trx: Knex,
    protected user: UserInfo,
    protected productId: string
  ) {}

  async getProductCategories() {
    const categoryLoader = LoaderFactory.categoryByProductLoader(this.trx);
    return await categoryLoader.load(this.productId);
  }

  async updateProductCategories(input: CategoryUpdateInput) {
    if (!input) return;
    const now = Formatter.getNowDateTime();
    await this.trx.transaction(async (trx) => {
      // find category that are not in the input and delete
      const toDetete: table_product_categories[] = await trx
        .table<table_product_categories>("product_categories")
        .whereNotIn(
          "id",
          input.filter((i) => i.id).map((i) => i.id)
        )
        .andWhere("product_id", this.productId);
      for (const i of toDetete) {
        await trx
          .table<table_product_categories>("product_categories")
          .where({ id: i.id, product_id: this.productId })
          .delete();

        // log user action
      }

      // create
      const toCreate = input.filter((i) => !i.id && i.categoryId);
      for (const i of toCreate) {
        const id = generateId();
        await trx.table<table_product_categories>("product_categories").insert({
          id,
          product_id: this.productId,
          category_id: i.categoryId,
          created_at: now,
        });

        // log user action
      }
    });
  }
}
