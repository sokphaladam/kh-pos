import { Knex } from "knex";
import { ProductCategoryDetail, ProductCategoryUpdate } from "./types";
import { Formatter } from "@/lib/formatter";
import { table_product_categories } from "@/generated/tables";
import { v4 } from "uuid";
import { LoaderFactory } from "@/dataloader/loader-factory";

export async function updateProductCategory(
  db: Knex,
  input: ProductCategoryUpdate[],
  productId: string
) {
  const result: ProductCategoryDetail[] = [];
  const now = Formatter.getNowDateTime();
  await db.transaction(async (trx) => {
    // find category that are not in the input and delete
    const toDetete: table_product_categories[] = await trx
      .table<table_product_categories>("product_categories")
      .whereNotIn(
        "id",
        input.filter((i) => i.id).map((i) => i.id)
      )
      .andWhere("product_id", productId);
    for (const i of toDetete) {
      await trx
        .table<table_product_categories>("product_categories")
        .where({ id: i.id, product_id: productId })
        .delete();

      // log user action
    }

    // update
    const toUpdate = input.filter((i) => i.action === "update");
    for (const i of toUpdate) {
      await trx
        .table<table_product_categories>("product_categories")
        .where({ id: i.id, product_id: productId })
        .update({
          category_id: i.categoryId,
          updated_at: now,
          product_id: productId,
        });
      result.push({
        id: i.id!,
        productId: productId,
        categoryId: i.categoryId,
      });

      // log user action
    }

    // create
    const toCreate = input.filter((i) => i.action === "create");
    for (const i of toCreate) {
      const id = v4();
      await trx.table<table_product_categories>("product_categories").insert({
        id,
        product_id: productId,
        category_id: i.categoryId,
        created_at: now,
      });
      result.push({
        id,
        productId: productId,
        categoryId: i.categoryId,
      });

      // log user action
    }
  });
  const categoryLoader = LoaderFactory.productCategoryLoader(db);
  return await Promise.all(
    result.map(async (r) => {
      return {
        ...r,
        category: await categoryLoader.load(r.categoryId),
      };
    })
  );
}
