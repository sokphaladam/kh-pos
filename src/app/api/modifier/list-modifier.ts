import { LoaderFactory } from "@/dataloader/loader-factory";
import { ProductModifierType } from "@/dataloader/product-variant-loader";
import { table_modifier, table_modifier_items } from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

export const listModifier = withAuthApi<
  unknown,
  unknown,
  ResponseType<{ total: number; data: ProductModifierType[] }>,
  { limit: number; offset: number }
>(async ({ db, searchParams }) => {
  const params = searchParams;
  const limit = params?.limit || 10;
  const offset = params?.offset || 0;

  const query = db.table("modifier").where("deleted_at", null);

  const { total } = await query
    .clone()
    .count("* as total")
    .first<{ total: number }>();

  const list: table_modifier[] = await query
    .clone()
    .limit(limit)
    .offset(offset);

  const items: table_modifier_items[] = await db
    .table("modifier_items")
    .whereIn(
      "modifier_id",
      list.map((x) => x.modifier_id)
    )
    .where("deleted_at", null);

  const userLoader = LoaderFactory.userLoader(db);

  const data = await Promise.all(
    list.map(async (x) => {
      return {
        ...x,
        title: x.title,
        description: x.description,
        modifierId: x.modifier_id,
        createdAt: Formatter.dateTime(x.created_at),
        createdBy: x.created_by ? await userLoader.load(x.created_by) : null,
        items: await Promise.all(
          items
            .filter((i) => i.modifier_id === x.modifier_id)
            .map(async (i) => {
              return {
                id: i.id,
                modifierId: i.modifier_id,
                name: i.name,
                createdAt: Formatter.dateTime(i.created_at),
                createdBy: i.created_by
                  ? await userLoader.load(i.created_by)
                  : null,
                price: Number(i.price || 0),
              };
            })
        ),
      } as ProductModifierType;
    })
  );

  return NextResponse.json(
    {
      success: true,
      result: {
        total,
        data,
      },
    },
    { status: 200 }
  );
});
