import { table_modifier_items } from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import DataLoader from "dataloader";
import { Knex } from "knex";
import { LoaderFactory } from "./loader-factory";
import { ProductModifierItemType } from "./product-variant-loader";

export function createModifierItemByIdLoader(db: Knex) {
  return new DataLoader(async (keys: readonly string[]) => {
    const modifierItems: table_modifier_items[] = await db
      .table("modifier_items")
      .whereIn("id", keys)
      .where("deleted_at", null)
      .select();

    const userLoader = LoaderFactory.userLoader(db);

    return await Promise.all(
      keys.map(async (key) => {
        const item = modifierItems.find((item) => item.id === key);
        if (!item) {
          return null;
        }

        return {
          id: item.id,
          modifierId: item.modifier_id,
          name: item.name,
          price: Number(item.price || 0),
          createdAt: item.created_at
            ? Formatter.dateTime(item.created_at)
            : null,
          createdBy: item.created_by
            ? await userLoader.load(item.created_by)
            : null,
        } as ProductModifierItemType;
      })
    );
  });
}
