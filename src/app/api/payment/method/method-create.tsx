import { table_payment_method } from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import { generateId } from "@/lib/generate-id";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

export const paymentMethodSchema = z.object({
  id: z.string().optional(),
  method: z.string(),
});

export type inputPaymentMethodType = z.infer<typeof paymentMethodSchema>;

export const createMethod = withAuthApi<
  inputPaymentMethodType,
  unknown,
  ResponseType<inputPaymentMethodType>
>(async ({ userAuth, db, body, logger }) => {
  const input = paymentMethodSchema.parse(body);

  const data = {
    method_id: input.id || generateId(),
    method: input.method,
    created_by: userAuth.admin!.id,
    created_at: Formatter.getNowDateTime(),
  };

  const res = await db
    .table<table_payment_method>("payment_method")
    .insert(data);

  logger.serverLog("payment_method:POST", {
    action: "create",
    table_name: "payment_method",
    key: String(res[0]),
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
