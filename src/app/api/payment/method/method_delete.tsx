import { table_payment_method } from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

export const deleteMethod = withAuthApi<
  { id: string },
  unknown,
  ResponseType<boolean>
>(async ({ userAuth, db, body, logger }) => {
  const data = {
    deleted_at: Formatter.getNowDateTime(),
    deleted_by: userAuth.admin!.id,
  };

  await db
    .table<table_payment_method>("payment_method")
    .where("method_id", (body as { id: string }).id)
    .update(data);

  logger.serverLog("payment_method:DELETE", {
    action: "delete",
    table_name: "payment_method",
    key: String((body as { id: string }).id),
    content: data,
  });

  return NextResponse.json(
    {
      success: true,
      result: true,
    },
    { status: 200 }
  );
});
