import { OrderModifierService } from "@/classes/order-modifier";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const modifierSchema = z.object({
  orderDetailId: z.string(),
  modifierItemId: z.string(),
  price: z.number().min(0),
  notes: z.string().max(500).optional(),
});

export const addOrderModifier = withAuthApi<
  unknown,
  { body: z.infer<typeof modifierSchema> },
  ResponseType<boolean>
>(
  async ({ db, userAuth, body }) => {
    console.log(userAuth);
    const modifierService = new OrderModifierService(
      db,
      userAuth.admin! || {
        ...userAuth.customer!,
        currentWarehouseId: userAuth.customer!.warehouseId,
      }
    );
    const input = modifierSchema.parse(body);
    await modifierService.addOrderModifier(input);
    return NextResponse.json({ success: true, result: true });
  },
  ["ADMIN", "CUSTOMER"]
);
