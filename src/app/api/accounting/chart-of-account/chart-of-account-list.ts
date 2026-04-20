import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { ChartOfAccount } from "./route";
import { Formatter } from "@/lib/formatter";
import { LoaderFactory } from "@/dataloader/loader-factory";

export const listChartOfAccounts = withAuthApi<
  unknown,
  unknown,
  ResponseType<{ data: ChartOfAccount[]; total: number }>,
  { limit: number; offset: number }
>(async ({ db, searchParams }) => {
  const params = searchParams;
  const limit = params?.limit || 30;
  const offset = params?.offset || 0;

  const query = db.table("chart_of_account").where({ deleted_at: null });

  const { total } = await query
    .clone()
    .count("* as total")
    .first<{ total: number }>();

  const rows = await query
    .clone()
    .select("*")
    .orderBy("created_at", "desc")
    .limit(limit)
    .offset(offset);

  const userLoader = LoaderFactory.userLoader(db);

  const data = await Promise.all(
    rows.map(async (row) => ({
      id: row.id,
      accountName: row.account_name,
      accountType: row.account_type,
      createdAt: Formatter.dateTime(row.created_at) || "",
      createdBy: await userLoader.load(row.created_by),
      updatedAt: row.updated_at
        ? Formatter.dateTime(row.updated_at) || undefined
        : undefined,
      updatedBy: row.updated_by
        ? await userLoader.load(row.updated_by)
        : undefined,
      deletedAt: row.deleted_at
        ? Formatter.dateTime(row.deleted_at) || undefined
        : undefined,
      deletedBy: row.deleted_by
        ? await userLoader.load(row.deleted_by)
        : undefined,
    })),
  );

  return NextResponse.json(
    {
      success: true,
      result: { data, total },
    },
    { status: 200 },
  );
});
