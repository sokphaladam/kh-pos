import withAuthApi from "@/lib/server-functions/with-auth-api";
import { inputPaymentMethodType, paymentMethodSchema } from "./method-create";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { Formatter } from "@/lib/formatter";
import { table_payment_method } from "@/generated/tables";

export const updateMethod = withAuthApi<
  inputPaymentMethodType,
  unknown,
  ResponseType<inputPaymentMethodType>
>(async ({ db, body, logger }) => {
  const input = paymentMethodSchema.parse(body);

  const data = {
    method: input.method,
    updated_at: Formatter.getNowDateTime(),
  };

  await db
    .table<table_payment_method>("payment_method")
    .where("method_id", input.id)
    .update(data);

  logger.serverLog("payment_method:PUT", {
    action: "update",
    table_name: "payment_method",
    key: String(input.id),
    content: data,
  });

  return NextResponse.json(
    {
      success: true,
      result: data,
    },
    { status: 200 }
  );
});
