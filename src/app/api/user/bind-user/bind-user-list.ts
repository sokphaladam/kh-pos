import { BindUserService } from "@/classes/bind-user";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

export const getBindUserList = withAuthApi<
  unknown,
  unknown,
  ResponseType<unknown>,
  { userId: string }
>(async ({ db, userAuth, searchParams }) => {
  const bindUserService = new BindUserService(db, userAuth.admin!);

  const list = await bindUserService.getBindUsersList(
    searchParams?.userId || "",
  );

  return NextResponse.json(
    {
      success: true,
      result: list,
    },
    { status: 200 },
  );
});
