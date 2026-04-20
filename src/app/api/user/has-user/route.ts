import withDatabaseApi from "@/lib/server-functions/with-database-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

export const GET = withDatabaseApi<
  unknown,
  unknown,
  ResponseType<boolean>,
  unknown
>(async ({ db }) => {
  const hasUser = await db.table("user").first();

  return NextResponse.json(
    {
      success: true,
      result: !!hasUser,
    },
    { status: 200 }
  );
});
