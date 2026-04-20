import { table_pricing_template } from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

export const deletePricingTemplate = withAuthApi<
  { id: string },
  unknown,
  ResponseType<string>
>(async ({ db, body, logger }) => {
  const data = {
    deleted_at: Formatter.getNowDateTime(),
  };

  await db
    .table<table_pricing_template>("pricing_template")
    .where("template_id", (body as { id: string }).id)
    .update(data);

  logger.serverLog("pricing_template:DELETE", {
    action: "delete",
    table_name: "pricing_template",
    key: String((body as { id: string }).id),
    content: data,
  });

  return NextResponse.json(
    {
      success: true,
      result: "Pricing template deleted successfully",
    },
    { status: 200 }
  );
});
