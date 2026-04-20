import { SlotService } from "@/classes/slot";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const inputCreateSlot = z.object({
  warehouseId: z.string().nonempty(),
  slotName: z.string().nonempty(),
  forReplenishment: z.boolean().optional(),
});

export type CreateSlotInput = z.infer<typeof inputCreateSlot>;

export const createSlot = withAuthApi<
  unknown,
  CreateSlotInput,
  ResponseType<string>
>(async ({ db, body, userAuth }) => {
  const input = inputCreateSlot.parse(body);
  const result = await new SlotService(db).createSlot({
    warehouseId: input.warehouseId,
    slotName: input.slotName,
    createdBy: userAuth.admin!.id,
    forReplenishment: input.forReplenishment,
  });
  return NextResponse.json({ success: true, result }, { status: 200 });
});
