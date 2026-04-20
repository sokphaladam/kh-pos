import { OrderReturnService } from "@/classes/order-return";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const inputSchema = z.object({
  id: z.string(),
});

export const POST = withAuthApi<
  unknown,
  { id: string },
  unknown,
  ResponseType<boolean>
>(async ({ db, userAuth, body }) => {
  const { id } = inputSchema.parse(body);
  const orderReturnService = new OrderReturnService(db, userAuth.admin!);
  const result = await orderReturnService.stockInOrderReturn(id);

  return NextResponse.json(
    {
      success: true,
      result,
    },
    { status: 200 }
  );
});
