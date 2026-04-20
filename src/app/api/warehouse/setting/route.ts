import { table_setting } from "@/generated/tables";
import withDatabaseApi from "@/lib/server-functions/with-database-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

export const GET = withDatabaseApi<
  unknown,
  unknown,
  ResponseType<table_setting[]>,
  { warehouse?: string }
>(async ({ db, searchParams }) => {
  const warehouseId = searchParams?.warehouse as string | undefined;
  const query = db.table("setting").where({ warehouse: null });

  if (warehouseId) {
    query.orWhere("warehouse", warehouseId);
  }

  const result = await query.select();

  return NextResponse.json(
    { success: true, result, error: "" },
    { status: 200 }
  );
});
