import { SlotService } from "@/classes/slot";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const deleteSlotInput = z.object({
  id: z.string(),
});

export const deleteSlot = withAuthApi<
  unknown,
  { id: string },
  ResponseType<boolean>
>(async ({ db, body }) => {
  const input = deleteSlotInput.parse(body);
  const result = await new SlotService(db).deleteSlot(input.id);

  return NextResponse.json({ success: true, result }, { status: 200 });
});
