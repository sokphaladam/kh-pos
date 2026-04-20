import { Formatter } from "@/lib/formatter";
import { Logger } from "@/lib/logger";
import { Knex } from "knex";
import { NextResponse } from "next/server";

export async function deleteProduct(
  db: Knex,
  params: { id: string } | undefined,
  logger: Logger
) {
  if (!params?.id) {
    return NextResponse.json(
      { success: false, error: "Missing product ID" },
      { status: 400 }
    );
  }
  const now = Formatter.getNowDateTime();
  await db.table("product").where("id", params.id).update({
    deleted_at: now,
  });
  logger.serverLog("product:delete", {
    action: "delete",
    table_name: "product",
    key: params.id,
    content: params,
  });
  return NextResponse.json(
    { success: true, id: params.id, result: true },
    { status: 200 }
  );
}
