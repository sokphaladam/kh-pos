import { AuthenticationUser } from "@/classes/authentication/user";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const inputSchemaChanagePassword = z.object({
  newPassword: z.string(),
  userId: z.string(),
});

export const POST = withAuthApi<
  unknown,
  { userId: string; newPassword: string },
  ResponseType<unknown>
>(async ({ db, body }) => {
  const input = inputSchemaChanagePassword.parse(body);

  const auth = new AuthenticationUser(db);

  const res = await auth.changePassword(input.userId, input.newPassword);

  return NextResponse.json({ success: res }, { status: 200 });
});
