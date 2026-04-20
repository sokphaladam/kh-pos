import { BacklogOrder, BacklogService } from "@/classes/back-log";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

export const GET = withAuthApi<
  unknown,
  unknown,
  ResponseType<{ data: BacklogOrder[]; total: number }>,
  { limit: number; offset: number }
>(async ({ db, userAuth, searchParams }) => {
  const params = searchParams;
  const limit = params?.limit || 10;
  const offset = params?.offset || 0;

  const backlogService = new BacklogService(db, userAuth.admin!);
  const result = await backlogService.backLogOrderList(limit, offset);

  return NextResponse.json(
    {
      success: true,
      result,
    },
    { status: 200 }
  );
});
