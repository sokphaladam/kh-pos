import { orderFilterSchema, Order, OrderService } from "@/classes/order";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

export const getOrderList = withAuthApi<
  unknown,
  unknown,
  ResponseType<{ totalRows: number; orders: Order[] }>,
  z.infer<typeof orderFilterSchema>
>(async ({ db, searchParams, userAuth }) => {
  const orderService = new OrderService(db);
  const params = orderFilterSchema.parse({
    ...searchParams,
    offset: Number(searchParams?.offset || 0),
    limit: Number(searchParams?.limit || 10),
  });

  return NextResponse.json(
    {
      success: true,
      result: await orderService.getOrderList(params, userAuth.admin!),
    },
    { status: 200 },
  );
});
