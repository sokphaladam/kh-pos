import { InvoiceNumberService } from "@/classes/invoice-number";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

export const GET = withAuthApi<
  unknown,
  unknown,
  ResponseType<number[]>,
  { n: number }
>(
  async ({ db, searchParams, userAuth }) => {
    const n = searchParams?.n || 1;
    const suggestedNumber = await new InvoiceNumberService(
      db,
      userAuth.admin! || {
        ...userAuth.customer!,
        currentWarehouseId: userAuth.customer!.warehouseId,
      }
    ).getNextInvoiceNumber(n);

    return NextResponse.json(
      {
        success: true,
        result: suggestedNumber,
      },
      { status: 200 }
    );
  },
  ["ADMIN", "CUSTOMER"]
);
