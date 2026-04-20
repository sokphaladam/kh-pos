import { InventoryTransactionService } from "@/classes/inventory-transaction";
import { InventoryTransaction } from "@/dataloader/inventory-transaction-loader";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

export const GET = withAuthApi<
  unknown,
  unknown,
  ResponseType<{ total: number; data: InventoryTransaction[] }>,
  { limit: number; offset: number; status?: string }
>(async ({ db, userAuth, searchParams }) => {
  const params = searchParams;
  const limit = params?.limit || 10;
  const offset = params?.offset || 0;
  const status = params?.status ? (params?.status || "").split(",") : undefined;
  const inventoryTransactionService = new InventoryTransactionService(
    db,
    userAuth.admin!
  );
  const result = await inventoryTransactionService.getTransactions(
    offset,
    limit,
    status
  );
  return NextResponse.json(
    {
      success: true,
      result: {
        data: result.data.filter((a) => a !== null) as InventoryTransaction[],
        total: result.total,
      },
    },
    { status: 200 }
  );
});
