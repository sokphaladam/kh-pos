import { Formatter } from "@/lib/formatter";
import { Logger } from "@/lib/logger";

import {
  inputProductSchema,
  Product,
  ProductInput,
} from "@/lib/types/product-type";
import { Knex } from "knex";
import { NextResponse } from "next/server";

export async function updateProduct(
  db: Knex,
  body: ProductInput | undefined,
  logger: Logger
) {
  const input = inputProductSchema.parse(body);
  const now = Formatter.getNowDateTime();
  if (!input.id) {
    return NextResponse.json(
      { success: false, error: "Missing product ID" },
      { status: 400 }
    );
  }
  await db
    .table("product")
    .where("id", input.id)
    .update({
      title: input.title,
      description: input.description,
      updated_at: now,
      weight: input.weight,
      length: input.length,
      width: input.width,
      height: input.height,
      is_composite: input.isComposite ? 1 : 0,
      use_production: input.useProduction ? 1 : 0,
      track_stock: input.trackStock ? 1 : 0,
      is_for_sale: input.isForSale ? 1 : 0,
    });

  logger.serverLog("product:update", {
    action: "update",
    table_name: "product",
    key: input.id,
    content: input,
  });
  return NextResponse.json(
    {
      success: true,
      result: {
        id: input.id,
        title: input.title || "",
        description: input.description || "",
        updatedAt: now,
        weight: input.weight,
        length: input.length,
        width: input.width,
        height: input.height,
        isComposite: input.isComposite || false,
        useProduction: input.useProduction || false,
        trackStock: input.trackStock || false,
        isForSale: input.isForSale || false,
      } as unknown as Product,
    },
    { status: 200 }
  );
}
