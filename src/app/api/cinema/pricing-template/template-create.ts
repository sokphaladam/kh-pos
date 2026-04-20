import { table_pricing_template } from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import { generateId } from "@/lib/generate-id";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

export const pricingTemplateSchema = z.object({
  id: z.string().optional(),
  template_name: z.string().min(1, "Template name is required"),
  time_slot: z.enum(["matinee", "evening", "late_night", "all_day"]),
  day_type: z.enum(["weekday", "weekend", "holiday", "all_days"]),
  extra_seat_prices: z.record(z.number()).nullable().optional(),
});

export type inputPricingTemplateType = z.infer<typeof pricingTemplateSchema>;

export const createPricingTemplate = withAuthApi<
  inputPricingTemplateType,
  unknown,
  ResponseType<table_pricing_template>
>(async ({ userAuth, db, body, logger }) => {
  const input = pricingTemplateSchema.parse(body);

  const data: table_pricing_template = {
    template_id: input.id || generateId(),
    warehouse_id: userAuth.admin?.currentWarehouseId || "",
    template_name: input.template_name,
    time_slot: input.time_slot,
    day_type: input.day_type,
    extra_seat_prices: input.extra_seat_prices
      ? (JSON.stringify(input.extra_seat_prices) as unknown as Record<
          string,
          number
        >)
      : null,
    created_by: userAuth.admin!.id,
    created_at: Formatter.getNowDateTime(),
    updated_at: null,
    deleted_at: null,
  };

  const res = await db
    .table<table_pricing_template>("pricing_template")
    .insert(data);

  logger.serverLog("pricing_template:POST", {
    action: "create",
    table_name: "pricing_template",
    key: String(res[0]),
    content: data as unknown as Record<string, unknown>,
  });

  return NextResponse.json(
    {
      success: true,
      result: data,
    },
    { status: 200 }
  );
});
