import { table_product_images } from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import { Logger } from "@/lib/logger";
import { ProductImage } from "@/repository/product-image-repository";
import { Knex } from "knex";
import { NextResponse } from "next/server";
import { v4 } from "uuid";

export interface ProductUpdate extends ProductImage {
  action: "update" | "create";
}

export async function updateProductImage(
  db: Knex,
  input: ProductUpdate[],
  productId: string,
  logger: Logger
) {
  if (!productId) {
    return NextResponse.json(
      { success: false, error: "Missing product ID" },
      { status: 400 }
    );
  }
  const result: ProductImage[] = [];
  const now = Formatter.getNowDateTime();
  await db.transaction(async (trx) => {
    // delete images that are not in the input
    await trx
      .table<table_product_images>("product_images")
      .whereNotIn(
        "id",
        input.filter((i) => i.id).map((i) => i.id)
      )
      .andWhere("product_id", productId)
      .delete();

    // update images that are in the input
    const imagesToUpdate = input.filter((i) => i.action === "update");

    for (const i of imagesToUpdate) {
      const updateInput = {
        image_order: i.imageOrder,
        updated_at: now,
        image_url: i.url,
        product_variant_id: i.productVariantId,
      };
      await trx
        .table<table_product_images>("product_images")
        .where("id", i.id)
        .update(updateInput);

      logger.serverLog("product_images:delete", {
        action: "update",
        table_name: "product_images",
        key: i.id || "",
        content: updateInput,
      });

      result.push(i);
    }

    // create new images
    const imagesToCreate = input.filter((i) => i.action === "create");
    if (imagesToCreate.length > 0) {
      await trx.table<table_product_images>("product_images").insert(
        imagesToCreate.map((i) => {
          const id = v4();

          result.push({
            id,
            productId: productId,
            url: i.url,
            imageOrder: i.imageOrder,
            createdAt: now,
            updatedAt: null,
          });

          const inputField = {
            // save to database
            id,
            product_id: productId,
            image_url: i.url,
            image_order: i.imageOrder,
            created_at: now,
          };

          logger.serverLog("product_images:create", {
            action: "create",
            table_name: "product_images",
            key: id,
            content: inputField,
          });

          return inputField;
        })
      );
    }
  });

  return NextResponse.json(
    {
      success: true,
      result,
    },
    { status: 200 }
  );
}
