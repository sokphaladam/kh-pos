import { ShiftService } from "@/classes/shift";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

export const GET = withAuthApi<
  unknown,
  unknown,
  ResponseType<unknown>,
  { id: string }
>(async ({ db, searchParams }) => {
  const id = searchParams?.id || "";

  const result = await new ShiftService(db).getShiftReceipt(id, 0, 0);

  return NextResponse.json({ success: true, result }, { status: 200 });
});
