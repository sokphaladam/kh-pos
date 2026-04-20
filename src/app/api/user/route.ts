// GET: to get list or specific id
// POST: to create
// PUT: to update
// DELETE: to delete

import createUser from "@/lib/server-functions/user/create-user";
import { UserInfo } from "@/lib/server-functions/get-auth-from-token";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType, UserInput } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserList } from "@/lib/server-functions/user/get-user";
import deleteUser from "@/lib/server-functions/user/delete-user";
import { updateUser } from "@/lib/server-functions/user/update-user";

// get user list
export const GET = withAuthApi<
  unknown,
  unknown,
  ResponseType<{ data: UserInfo[]; total: number }>
>(async ({ db, userAuth, req }) => {
  const params = req.nextUrl.searchParams;
  const limit = parseInt(params.get("limit") || "10", 10);
  const offset = parseInt(params.get("offset") || "0", 0);

  const users: { data: UserInfo[]; total: number } = await getUserList(
    db,
    limit,
    offset,
    userAuth.admin!
  );

  if (users) {
    return NextResponse.json({ success: true, result: users }, { status: 200 });
  }

  return NextResponse.json(
    { success: false, error: "No user found" },
    { status: 500 }
  );
});

const inputSchema = z.object({
  id: z.string().optional(),
  username: z.string(),
  password: z.string(),
  phoneNumber: z.string(),
  fullname: z.string(),
  profile: z.string(),
  roleId: z.string(),
  warehouseId: z.string(),
});

// create new user
export const POST = withAuthApi<unknown, UserInput, UserInfo>(
  async ({ db, req, body, logger, userAuth: currentUser }) => {
    const input: UserInput = inputSchema.parse(body);

    const user: UserInfo = await createUser(req, db, input, currentUser.admin!);

    logger.serverLog("user:create", {
      action: "create",
      table_name: "user",
      key: user.id,
    });
    return NextResponse.json(user, { status: 200 });
  }
);

export const PUT = withAuthApi<
  unknown,
  UserInput,
  ResponseType<{ message: string }>
>(async ({ db, body, logger }) => {
  const input: UserInput = inputSchema.parse(body);

  if (!input.id) {
    return NextResponse.json(
      { success: false, error: "User ID is required" },
      { status: 400 }
    );
  }

  const result = await updateUser(db, input);

  logger.serverLog("user:update", {
    action: "update",
    table_name: "user",
    key: input.id,
  });

  return NextResponse.json(result, {
    status: result.success ? 200 : 500,
  });
});

export const DELETE = withAuthApi<
  unknown,
  { id: string },
  ResponseType<{ message: string }>
>(async ({ db, body, logger }) => {
  if (!body?.id) {
    return NextResponse.json(
      { success: false, error: "User ID is required" },
      { status: 400 }
    );
  }

  const result = await deleteUser(db, body?.id || "");

  logger.serverLog("user:delete", {
    action: "delete",
    table_name: "user",
    key: body.id,
    content: {},
  });
  return NextResponse.json(result, {
    status: result.success ? 200 : 500,
  });
});
