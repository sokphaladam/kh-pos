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
      .whereIn("product_id", keys);

    // modifierLoader only returns non-deleted modifiers (null otherwise)
    const modifierLoader = LoaderFactory.modifierLoader(db);

    return Promise.all(
      keys.map(async (key) => {
        const rows = modifier.filter((mod) => mod.product_id === key);
        const items = await Promise.all(
          rows.map((x) => modifierLoader.load(x.modifier_id)),
        );
        return items.filter(
          (item) => item !== null,
        ) as unknown as ProductModifierType[];
      })
    );
  });
}
