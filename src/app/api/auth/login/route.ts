import { AuthenticationUser } from "@/classes/authentication/user";
import withDatabaseApi from "@/lib/server-functions/with-database-api";
import { LoginResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";
interface body {
  username: string;
  password: string;
}

const inputLoginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export const POST = withDatabaseApi<unknown, body, LoginResponseType>(
  async ({ db, body }) => {
    const auth = new AuthenticationUser(db);

    const { username, password } = inputLoginSchema.parse(body);

    const token = await auth.validatePassword(username, password);
    if (!token) {
      return NextResponse.json({ error: "Invalid username or password" });
    }
    return NextResponse.json({ token });
  }
);
