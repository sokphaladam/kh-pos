import { table_product_images } from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import { Logger } from "@/lib/logger";
import { ProductImage } from "@/repository/product-image-repository";
import { Knex } from "knex";
import { NextResponse } from "next/server";
import { v4 } from "uuid";

interface ProductInput {
  url: string;
  imageOrder: number;
  productVariantId?: string | undefined;
}

export async function createProductImage(
  db: Knex,
  input: ProductInput[],
  productId: string,
  logger: Logger
) {
  const result: ProductImage[] = [];
  const now = Formatter.getNowDateTime();

  if (!productId) {
    return NextResponse.json(
      { success: false, error: "Missing product ID" },
      { status: 400 }
    );
  }

  await db.table<table_product_images>("product_images").insert(
    input.map((i) => {
      const id = v4();
      const input = {
        id,
        productId,
        url: i.url,
        imageOrder: i.imageOrder,
        createdAt: now,
        updatedAt: null,
      };
      result.push(input);

      logger.serverLog("product_images:create", {
        key: id,
        action: "create",
        table_name: "product_images",
        content: input,
      });

      return {
        id,
        product_id: productId,
        image_url: i.url,
        image_order: i.imageOrder,
        created_at: now,
      };
    })
  );

  return NextResponse.json(
    {
      success: true,
      result,
    },
    { status: 200 }
  );
}
