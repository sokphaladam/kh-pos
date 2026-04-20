import { Formatter } from "@/lib/formatter";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

export const modifierSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  items: z.array(
    z.object({
      id: z.string().optional(),
      name: z.string(),
      price: z.number(),
    })
  ),
});

export type inputModifierType = z.infer<typeof modifierSchema>;

export const deleteModifier = withAuthApi<
  { id: string },
  unknown,
  ResponseType<boolean | null>
>(async ({ db, userAuth, body }) => {
  const user = userAuth.admin!;
  await db
    .table("modifier")
    .where({ modifier_id: (body as { id: string }).id })
    .update({
      deleted_by: user.id,
      deleted_at: Formatter.getNowDateTime(),
      update_at: Formatter.getNowDateTime(),
      updated_by: user.id,
    });

  return NextResponse.json(
    {
      success: true,
      result: true,
    },
    { status: 200 }
  );
});
