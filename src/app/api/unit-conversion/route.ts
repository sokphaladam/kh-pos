import {
  convertProductVariantStockSchema,
  ProductVariantConversion,
} from "@/classes/product-variant-conversion";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

export const POST = withAuthApi<
  unknown,
  z.infer<typeof convertProductVariantStockSchema>,
  ResponseType<boolean>
>(async ({ body, userAuth, db }) => {
  // Validate and parse the request body
  const input = convertProductVariantStockSchema.parse(body);

  // Perform the stock conversion
  const result = await db.transaction(async (trx) => {
    const service = new ProductVariantConversion(trx, userAuth.admin!);
    if (input.conversionType === "REPACK") {
      return await service.repackProductVariantStock(input);
    } else if (input.conversionType === "BREAK") {
      return await service.breakBulkProductVariantStock(input);
    } else {
      const archiveQty = await service.breakBulkProductVariantStock(input);
      if (archiveQty > 0) {
        return await service.repackProductVariantStock({
          ...input,
          destinationQty: input.destinationQty - archiveQty,
        });
      }
    }
    return 0;
  });

  return NextResponse.json(
    {
      success: true,
      result: result > 0,
    },
    { status: 200 }
  );
});
