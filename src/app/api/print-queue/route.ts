import { PrintToKitchenService } from "@/classes/print-to-kitchen";
import { KitchenPrintItem } from "@/classes/order-status";
import { table_print_queue } from "@/generated/tables";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

export const GET = withAuthApi<
  unknown,
  unknown,
  ResponseType<table_print_queue[]>,
  {
    printer_name: string;
  }
>(async ({ db, userAuth, searchParams }) => {
  const printQueues = await new PrintToKitchenService(
    db,
    userAuth.admin!,
  ).getPrintQueues(searchParams?.printer_name);
  return NextResponse.json(
    { success: true, result: printQueues },
    { status: 200 },
  );
});

export type PrintToKitchenResponse = ResponseType<unknown> & {
  // Same "push straight to this device's print-socket instead of waiting
  // for the poller" ticket as UpdateOrderItemStatusResponse - see that type
  // for details. Empty on the `testing` path (no single item to push).
  kitchenPrintItems?: KitchenPrintItem[];
};

export const POST = withAuthApi<
  unknown,
  { orderDetailId: string; qty: number; reprint?: boolean; testing?: boolean },
  PrintToKitchenResponse
>(async ({ db, userAuth, body }) => {
  const printToKitchenService = new PrintToKitchenService(db, userAuth.admin!);

  if (!!body?.testing) {
    await printToKitchenService.printTestContent(body?.qty || 0);
    return NextResponse.json({ success: true, result: true }, { status: 200 });
  }

  const printed = await printToKitchenService.printOrderToKitchen(
    body?.orderDetailId || "",
    body?.qty || 0,
    body?.reprint || false,
  );

  const kitchenPrintItems: KitchenPrintItem[] = printed
    ? [
        {
          id: printed.queueId,
          content: printed.content,
          printer_info: printed.printerInfo,
        },
      ]
    : [];

  return NextResponse.json(
    { success: true, result: true, kitchenPrintItems },
    { status: 200 },
  );
});
