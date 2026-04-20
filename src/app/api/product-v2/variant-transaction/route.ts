import { InventoryTransactionService } from "@/classes/inventory-transaction";
import { InventoryTransaction } from "@/dataloader/inventory-transaction-loader";

import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const productTransactionSchema = z.object({
  variant_id: z.string().nonempty("ID is required"),
});
export const GET = withAuthApi<
  unknown,
  unknown,
  ResponseType<InventoryTransaction[]>,
  { variant_id: string }
>(async ({ db, userAuth, searchParams }) => {
  const { variant_id: variantId } =
    productTransactionSchema.parse(searchParams);

  const transactionService = new InventoryTransactionService(
    db,
    userAuth.admin!
  );
  const transactions = await transactionService.getProductVariantTransactions(
    variantId
  );

  return NextResponse.json(
    {
      success: true,
      result: transactions.filter((t) => t !== null) as InventoryTransaction[],
    },
    { status: 200 }
  );
});
