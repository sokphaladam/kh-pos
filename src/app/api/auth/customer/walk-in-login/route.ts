import {
  CustomerAuthentication,
  WalkinLoginInput,
  walkinLoginInputSchema,
} from "@/classes/authentication/customer-auth";
import { CustomerInfo } from "@/lib/server-functions/get-auth-from-token";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import withDatabaseApi from "@/lib/server-functions/with-database-api";
import { NextResponse } from "next/server";

export const POST = withDatabaseApi<
  unknown,
  WalkinLoginInput,
  { token: string }
>(async ({ db, body }) => {
  const input = walkinLoginInputSchema.parse(body);
  const auth = new CustomerAuthentication(db);
  const token = await auth.walkinLogin(input);
  return NextResponse.json({ token });
});

export const GET = withAuthApi<
  unknown,
  unknown,
  { user: CustomerInfo } | { error: string }
>(
  async ({ userAuth }) => {
    if (!userAuth.customer) {
      return NextResponse.json({ error: "No user found" }, { status: 401 });
    }
    return NextResponse.json({ user: userAuth.customer }, { status: 200 });
  },
  ["CUSTOMER"]
);
