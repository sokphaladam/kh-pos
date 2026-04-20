import { table_modifier_items } from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import { generateId } from "@/lib/generate-id";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { inputModifierType, modifierSchema } from "./create-modifier";

export const updateModifier = withAuthApi<
  inputModifierType,
  unknown,
  ResponseType<boolean>
>(async ({ db, userAuth, body }) => {
  const input = modifierSchema.parse(body);
  const user = userAuth.admin!;

  const id = input.id ?? "";

  const res = await db.transaction(async (trx) => {
    await trx
      .table("modifier")
      .update({
        title: input.title,
        description: input.description,
        update_at: Formatter.getNowDateTime(),
        updated_by: user.id,
      })
      .where({ modifier_id: id });

    const modifier_items: table_modifier_items[] = [];
    const modifier_items_new: table_modifier_items[] = [];

    for (const x of input.items) {
      if (!!x.id) {
        modifier_items_new.push({
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
      } else {
        modifier_items.push({
          id: x.id ?? "",
          modifier_id: id,
          name: x.name,
          price: String(x.price || 0),
          created_at: Formatter.getNowDateTime(),
          created_by: user.id,
          updated_at: Formatter.getNowDateTime(),
          updated_by: user.id,
          deleted_by: null,
          deleted_at: null,
        });
      }
    }
    // update to delete
    await trx
      .table("modifier_items")
      .whereNotIn(
        "id",
        modifier_items.map((x) => x.id)
      )
      .where({ modifier_id: id })
      .update({
        deleted_at: Formatter.getNowDateTime(),
        deleted_by: user.id,
        updated_at: Formatter.getNowDateTime(),
        updated_by: user.id,
      });

    // new modifier items
    if (modifier_items_new.length > 0) {
      await trx.table("modifier_items").insert(modifier_items_new);
    }

    // update old modifier items
    if (modifier_items.length > 0) {
      for (const x of modifier_items) {
        await trx.table("modifier_items").where({ id: x.id }).update({
          name: x.name,
          price: x.price,
          updated_at: Formatter.getNowDateTime(),
          updated_by: user.id,
        });
      }
    }

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
