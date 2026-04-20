import { ShiftService } from "@/classes/shift";
import { LoaderFactory } from "@/dataloader/loader-factory";
import { table_shift } from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import { UserInfo } from "@/lib/server-functions/get-auth-from-token";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

interface ShiftProps {
  opened_by: UserInfo | null;
  closed_by: UserInfo | null;
}

export type ShiftType = Omit<table_shift, "opened_by" | "closed_by"> &
  ShiftProps;

export const GET = withAuthApi<
  unknown,
  unknown,
  ResponseType<{ total: number; data: ShiftType[] }>
>(async ({ db, req, userAuth }) => {
  const searchParams = req.nextUrl.searchParams;
  const openedBy = searchParams.get("openedBy") || "";
  const limit = Number(searchParams.get("limit") || 30);
  const offset = Number(searchParams.get("offset") || 0);
  const id = searchParams.get("id") || "";

  const userLoader = LoaderFactory.userLoader(db);

  const query = db.table<table_shift>("shift").orderBy("opened_at", "desc");

  if (openedBy && userAuth.admin?.role?.role !== "OWNER") {
    query.where("opened_by", openedBy);
  }

  if (id) {
    query.where("shift_id", id);
  }

  const { total } = await query
    .clone()
    .count("* as total")
    .first<{ total: number }>();

  const shift: table_shift[] = await query
    .clone()
    .select()
    .offset(offset)
    .limit(limit);

  const shiftServer = new ShiftService(db);

  const result: ShiftType[] = await Promise.all(
    shift.map(async (x) => {
      const receipt =
        x.status === "OPEN"
          ? await shiftServer.getShiftReceipt(x.shift_id, 0, 0)
          : x.receipt;
      return {
        ...x,
        opened_at: x.opened_at ? Formatter.dateTime(x.opened_at) : null,
        closed_at: x.closed_at ? Formatter.dateTime(x.closed_at) : null,
        opened_by: x.opened_by ? await userLoader.load(x.opened_by) : null,
        closed_by: x.closed_by ? await userLoader.load(x.closed_by) : null,
        receipt,
      };
    })
  );

  return NextResponse.json(
    { success: true, result: { total, data: result } },
    { status: 200 }
  );
});
