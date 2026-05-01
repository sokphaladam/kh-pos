import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

const inputSettingSchema = z.object({
  id: z.number(),
  option: z.string().optional(),
  value: z.string(),
});

export type inputSettingType = z.infer<typeof inputSettingSchema>;

export const settingUpdate = withAuthApi<
  inputSettingType,
  unknown,
  ResponseType<unknown>
>(async ({ db, body, userAuth }) => {
  const input = inputSettingSchema.parse(body);

  const setting = await db
    .table("setting")
    .where({
      id: input.id,
    })
    .select();

  await db
    .table("setting")
    .where(
      setting.length > 1
        ? {
            id: input.id,
            warehouse: userAuth.admin?.currentWarehouseId,
          }
        : {
            id: input.id,
          },
    )
    .update({ value: input.value });

  revalidatePath("/", "layout");

  return NextResponse.json({ success: true, result: input }, { status: 200 });
});
