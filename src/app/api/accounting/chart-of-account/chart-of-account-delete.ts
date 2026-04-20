import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { Formatter } from "@/lib/formatter";

export const deleteChartOfAccount = withAuthApi<
  { id: string },
  unknown,
  ResponseType<unknown>
>(async ({ db, body, userAuth }) => {
  await db
    .table("chart_of_account")
    .where("id", (body as { id: string }).id)
    .update({
      deleted_at: Formatter.getNowDateTime(),
      deleted_by: userAuth.admin?.id,
    });

  return NextResponse.json(
    {
      success: true,
      message: "Chart of account deleted successfully",
    },
    { status: 200 },
  );
});
