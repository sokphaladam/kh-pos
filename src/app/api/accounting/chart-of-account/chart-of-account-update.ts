import { ResponseType } from "@/lib/types";
import { SchemaChartOfAccount, TypeSchemaChartOfAccount } from "./schema";
import { NextResponse } from "next/server";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { Formatter } from "@/lib/formatter";

export const updateChartOfAccount = withAuthApi<
  unknown,
  TypeSchemaChartOfAccount,
  ResponseType<unknown>
>(async ({ db, body, userAuth }) => {
  const input = SchemaChartOfAccount.parse(body);

  await db.table("chart_of_account").where("id", input.id).update({
    account_name: input.account_name,
    account_type: input.account_type,
    updated_at: Formatter.getNowDateTime(),
    updated_by: userAuth.admin?.id,
  });

  return NextResponse.json(
    {
      success: true,
      message: "Chart of account updated successfully",
    },
    { status: 200 },
  );
});
