import { UndoCustomerOrderService } from "@/classes/undo-customer-order";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const idSchema = z.object({
  id: z.string(),
});

export const PUT = withAuthApi<
  { id: string },
  unknown,
  ResponseType<{ orderId: string; tableNumber: string | null }>
>(async ({ params, db, userAuth }) => {
  const id = idSchema.parse(params).id;

  const service = new UndoCustomerOrderService(db, userAuth.admin!);
  const result = await service.undoOrderFromCompletedToDraft(id);

  return NextResponse.json({ success: true, result });
});
