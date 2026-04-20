import withAuthApi from "@/lib/server-functions/with-auth-api";
import { MeResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

export const GET = withAuthApi<unknown, unknown, MeResponseType>(
  async ({ userAuth }) => {
    if (!userAuth.admin) {
      return NextResponse.json({ error: "No user found" }, { status: 401 });
    }
    return NextResponse.json({ user: userAuth.admin }, { status: 200 });
  }
);
