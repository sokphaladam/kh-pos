import { Formatter } from "@/lib/formatter";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { NextResponse } from "next/server";

export const deleteTable = withAuthApi<{ id: string }>(
  async ({ db, body, userAuth }) => {
    const { id } = body as { id: string };
    await db
      .table("restaurant_tables")
      .update({
        deleted_at: Formatter.getNowDateTime(),
        deleted_by: userAuth.admin!.id,
      })
      .where({ id });

    return NextResponse.json({ success: true, result: true }, { status: 200 });
  }
);
