import { PrintToKitchenService } from "@/classes/print-to-kitchen";
import { table_print_queue } from "@/generated/tables";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

export const GET = withAuthApi<
  unknown,
  unknown,
  ResponseType<table_print_queue[]>
>(async ({ db, userAuth }) => {
  const printQueues = await new PrintToKitchenService(
    db,
    userAuth.admin!,
  ).getPrintQueues();
  return NextResponse.json(
    { success: true, result: printQueues },
    { status: 200 },
  );
});

export const POST = withAuthApi<
  unknown,
  { orderDetailId: string; qty: number },
  ResponseType<unknown>
>(async ({ db, userAuth, body }) => {
  const printToKitchenService = new PrintToKitchenService(db, userAuth.admin!);
  await printToKitchenService.printOrderToKitchen(
    body?.orderDetailId || "",
    body?.qty || 0,
  );
  return NextResponse.json({ success: true, result: true }, { status: 200 });
});
