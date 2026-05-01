import { BindUserService } from "@/classes/bind-user";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

export const GET = withAuthApi<
  unknown,
  unknown,
  ResponseType<number>,
  { userId: string }
>(async ({ db, userAuth, searchParams }) => {
  const bindUserService = new BindUserService(db, userAuth.admin!);

  const group = await bindUserService.getBindUserGroup(
    searchParams?.userId || "",
  );

  return NextResponse.json(
    {
      success: true,
      result: group,
    },
    { status: 200 },
  );
});
