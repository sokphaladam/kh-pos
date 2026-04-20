import { ProductService } from "@/classes/product-service";
import { Formatter } from "@/lib/formatter";
import { Logger } from "@/lib/logger";
import {
  inputProductSchema,
  Product,
  ProductInput,
} from "@/lib/types/product-type";
import { Knex } from "knex";
import { NextResponse } from "next/server";
import { UserInfo } from "../get-auth-from-token";

export async function createProduct(
  db: Knex,
  body: ProductInput | undefined,
  logger: Logger,
  user: UserInfo
) {
  const input = inputProductSchema.parse(body);
  const now = Formatter.getNowDateTime();
  await db.transaction(async (trx) => {
    const productService = new ProductService(trx, user);
    await productService.createProduct(input);
  });

  logger.serverLog("product:POST", {
    action: "create",
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
        createdAt: now,
        updatedAt: null,
        deletedAt: null,
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
