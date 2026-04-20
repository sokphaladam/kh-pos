import DataLoader from "dataloader";
import { Knex } from "knex";
import { LoaderFactory } from "./loader-factory";
import { ProductModifierType } from "./product-variant-loader";

export function createModifierByProductLoader(
  db: Knex
): DataLoader<string, ProductModifierType[]> {
  return new DataLoader(async (keys: readonly string[]) => {
    const modifier = await db
      .table("product_modifier")
      .innerJoin(
        "modifier",
        "product_modifier.modifier_id",
        "modifier.modifier_id"
      )
      .whereIn("product_id", keys)
      .where("modifier.deleted_at", null)
      .select("product_modifier.*");

    const modifierLoader = LoaderFactory.modifierLoader(db);

    const result = await Promise.all(
      keys.map(async (key) => {
        if (modifier.length === 0) return [];
        const rows = modifier.filter((mod) => mod.product_id === key) || [];
        const items = [];
        for (const x of rows) {
          const modifierItem = await modifierLoader.load(x.modifier_id);
          if (modifierItem !== null) {
            items.push(modifierItem as ProductModifierType);
          }
        }
        if (rows.length === 0) return [];
        return items;
      })
    );

    return result;
  });
}
