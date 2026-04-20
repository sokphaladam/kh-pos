import { FindProductInSlotResult } from "@/classes/find-product-in-slot";
import { OrderReturnService } from "@/classes/order-return";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const idSchema = z.object({
  id: z.string(),
});

export const GET = withAuthApi<
  unknown,
  unknown,
  ResponseType<FindProductInSlotResult[]>,
  { id: string }
>(async ({ db, userAuth, searchParams }) => {
  const { id } = idSchema.parse(searchParams);
  const orderReturnService = new OrderReturnService(db, userAuth.admin!);
  const result = await orderReturnService.orderReturnSlotList(id);
  return NextResponse.json(
    {
      success: true,
      result,
    },
    { status: 200 }
  );
});
