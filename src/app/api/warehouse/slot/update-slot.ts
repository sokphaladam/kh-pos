import { SlotService } from "@/classes/slot";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

import { z } from "zod";
const inputUpdateSlot = z.object({
  warehouseId: z.string().nonempty(),
  slotName: z.string().nonempty(),
  forReplenishment: z.boolean().optional(),
  id: z.string().nonempty(),
});
export type UpdateSlotInput = z.infer<typeof inputUpdateSlot>;

export const updateSlot = withAuthApi<
  unknown,
  UpdateSlotInput,
  ResponseType<boolean>
>(async ({ db, body, userAuth }) => {
  const input = inputUpdateSlot.parse(body);

  const result = await new SlotService(db).updateSlot({
    id: input.id,
    warehouseId: input.warehouseId,
    slotName: input.slotName,
    forReplenishment: input.forReplenishment,
    updatedBy: userAuth.admin!.id,
  });

  return NextResponse.json({ success: true, result }, { status: 200 });
});
