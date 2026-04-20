import { PrintToKitchenService } from "@/classes/print-to-kitchen";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const deleteSchema = z.object({
  ids: z.array(z.number()).min(1),
});

export const DELETE = withAuthApi<
  unknown,
  z.infer<typeof deleteSchema>,
  ResponseType<boolean>
>(async ({ db, userAuth, body }) => {
  const { ids } = deleteSchema.parse(body);
  const printQueue = await new PrintToKitchenService(
    db,
    userAuth.admin!
  ).deletePrintQueue(ids);
  return NextResponse.json(
    { success: true, result: printQueue },
    { status: 200 }
  );
});
