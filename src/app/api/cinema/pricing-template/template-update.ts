import withAuthApi from "@/lib/server-functions/with-auth-api";
import {
  inputPricingTemplateType,
  pricingTemplateSchema,
} from "./template-create";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { Formatter } from "@/lib/formatter";
import { table_pricing_template } from "@/generated/tables";

export const updatePricingTemplate = withAuthApi<
  inputPricingTemplateType,
  unknown,
  ResponseType<inputPricingTemplateType>
>(async ({ db, body, logger }) => {
  const input = pricingTemplateSchema.parse(body);

  const data: Partial<table_pricing_template> = {
    template_name: input.template_name,
    time_slot: input.time_slot,
    day_type: input.day_type,
    extra_seat_prices: input.extra_seat_prices
      ? (JSON.stringify(input.extra_seat_prices) as unknown as Record<
          string,
          number
        >)
      : null,
    updated_at: Formatter.getNowDateTime(),
  };

  await db
    .table<table_pricing_template>("pricing_template")
    .where("template_id", input.id)
    .update(data);

  logger.serverLog("pricing_template:PUT", {
    action: "update",
    table_name: "pricing_template",
    key: String(input.id),
    content: data,
  });

  return NextResponse.json(
    {
      success: true,
      result: input,
    },
    { status: 200 }
  );
});
