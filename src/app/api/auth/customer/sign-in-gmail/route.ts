import { Formatter } from "@/lib/formatter";
import { generateId, generateUserToken } from "@/lib/generate-id";
import withDatabaseApi from "@/lib/server-functions/with-database-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const inputSchema = z.object({
  email: z.string().email(),
  emailKey: z.string(),
  name: z.string(),
  photo: z.string().optional(),
  metadata: z.any().optional(),
  platform: z.enum(["web", "ios", "android"]).optional(),
  deviceId: z.string().optional(),
  lat: z.string().optional(),
  lng: z.string().optional(),
});

type InputType = z.infer<typeof inputSchema>;

export const POST = withDatabaseApi<InputType, ResponseType<unknown>>(
  async ({ db, body }) => {
    const input = inputSchema.parse(body);

    const res = await db.transaction(async (trx) => {
      const existingEmail = await trx
        .table("customer")
        .where({
          email: input.email,
          email_key: input.emailKey,
        })
        .first();

      const customerId = existingEmail ? existingEmail.id : generateId();

      if (!existingEmail) {
        await trx.table("customer").insert({
          id: customerId,
          email: input.email,
          email_key: input.emailKey,
          customer_name: input.name,
          photo: input.photo || null,
          created_at: Formatter.getNowDateTime(),
        });
      }

      const token = generateUserToken();

      await trx
        .table("customer_token")
        .where({ customer_id: customerId, device_id: input.deviceId })
        .update({
          is_revoked: true,
          expires_at: Formatter.getNowDateTime(),
        });

      await trx.table("customer_token").insert({
        customer_id: customerId,
        device_id: input.deviceId || null,
        expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // expire in 30 day
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        platform: input.platform || null,
        lat: input.lat || null,
        lng: input.lng || null,
        token,
        token_type: "online",
        created_at: Formatter.getNowDateTime(),
      });

      return token;
    });

    return NextResponse.json(
      { success: true, result: { token: res }, error: "" },
      { status: 200 },
    );
  },
);
