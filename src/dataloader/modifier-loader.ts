import { table_modifier, table_modifier_items } from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import DataLoader from "dataloader";
import { Knex } from "knex";
import { LoaderFactory } from "./loader-factory";

export function createModifierItemLoader(db: Knex) {
  return new DataLoader(async (keys: readonly string[]) => {
    const modifierItems: table_modifier_items[] = await db
      .table("modifier_items")
      .whereIn("modifier_id", keys)
      .where("deleted_at", null)
      .select();

    const userLoader = LoaderFactory.userLoader(db);
    return keys.map((key) =>
      modifierItems
        .filter((item) => item.modifier_id === key)
        .map((x) => {
          return {
            id: x.id,
            modifierId: x.modifier_id,
            name: x.name,
            price: Number(x.price || 0),
            createdAt: x.created_at ? Formatter.dateTime(x.created_at) : null,
            createdBy: x.created_by ? userLoader.load(x.created_by) : null,
          };
        })
    );
  });
}

export function createModifierLoader(db: Knex) {
  return new DataLoader(async (keys: readonly string[]) => {
    const modifier: table_modifier[] = await db
      .table("modifier")
      .whereIn("modifier_id", keys)
      .where("deleted_at", null);

    const modifierItemsLoader = createModifierItemLoader(db);
    const userLoader = LoaderFactory.userLoader(db);

    return await Promise.all(
      keys.map(async (key) => {
        const row = modifier.find((mod) => mod.modifier_id === key);

        if (!row) return null;

        return {
          ...row,
          modifierId: row.modifier_id,
          title: row.title,
          description: row.description,
          createdAt: row.created_at ? Formatter.dateTime(row.created_at) : null,
          createdBy: row.created_by ? userLoader.load(row.created_by) : null,
          items: await modifierItemsLoader.load(key),
        };
      })
    );
  });
}
