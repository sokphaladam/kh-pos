import { table_modifier_items } from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import { generateId } from "@/lib/generate-id";
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

export const createModifier = withAuthApi<
  inputModifierType,
  unknown,
  ResponseType<boolean>
>(async ({ db, userAuth, body }) => {
  const input = modifierSchema.parse(body);
  const user = userAuth.admin!;

  const id = input.id || generateId();

  const res = await db.transaction(async (trx) => {
    await trx.table("modifier").insert({
      modifier_id: id,
      title: input.title,
      description: input.description,
      created_at: Formatter.getNowDateTime(),
      created_by: user.id,
      updated_by: user.id,
    });

    const modifier_items: table_modifier_items[] = [];

    for (const x of input.items) {
      modifier_items.push({
        id: generateId(),
        modifier_id: id,
        name: x.name,
        price: String(x.price || 0),
        created_at: Formatter.getNowDateTime(),
        created_by: user.id,
        updated_at: null,
        updated_by: null,
        deleted_by: null,
        deleted_at: null,
      });
    }

    await trx.table("modifier_items").insert(modifier_items);

    return true;
  });

  return NextResponse.json(
    {
      success: res ? true : false,
      result: res ? true : false,
    },
    { status: res ? 200 : 500 }
  );
});
