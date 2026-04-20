import { OrderReturn, OrderReturnService } from "@/classes/order-return";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

export const orderReturnList = withAuthApi<
  unknown,
  unknown,
  ResponseType<{ totalRows: number; data: OrderReturn[] }>,
  { offset: number; limit: number; status?: string }
>(async ({ db, userAuth, searchParams }) => {
  const { offset = 0, limit = 10, status } = searchParams ?? {};

  const orderReturnList = new OrderReturnService(
    db,
    userAuth.admin!
  ).getOrderReturnList(
    offset,
    limit,
    status ? (status as "returned" | "stock_in") : undefined
  );

  return NextResponse.json(
    {
      success: true,
      result: await orderReturnList,
    },
    { status: 200 }
  );
});
