import {
  BindUserProps,
  BindUserSchema,
  BindUserService,
} from "@/classes/bind-user";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

export const createBindUser = withAuthApi<
  unknown,
  BindUserProps,
  ResponseType<unknown>
>(async ({ db, body, userAuth }) => {
  const input = BindUserSchema.parse(body);

  const bindUserService = new BindUserService(db, userAuth.admin!);

  await bindUserService.createBindUser(input);

  return NextResponse.json(
    {
      success: true,
      message: "Bind user created successfully",
    },
    { status: 200 },
  );
});
