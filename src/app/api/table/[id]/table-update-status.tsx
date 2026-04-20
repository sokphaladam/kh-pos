import withAuthApi from "@/lib/server-functions/with-auth-api";
import { NextResponse } from "next/server";

export const updateTableStatus = withAuthApi<
  { id: string },
  { status: string }
>(
  async ({ db, params, body }) => {
    await db.table("restaurant_tables").where({ id: params?.id }).update({
      status: body?.status,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  },
  ["ADMIN", "CUSTOMER"]
);
