import { table_product_discount } from "@/generated/tables";
import DataLoader from "dataloader";
import { Knex } from "knex";

export function appliedProductDiscountLoader(
  db: Knex
): DataLoader<string, table_product_discount[]> {
  return new DataLoader(async (keys: readonly string[]) => {
    const rows = await db
      .table<table_product_discount>("product_discount")
      .whereIn("discount_id", keys);
    const discountMap: Record<string, table_product_discount[]> = {};

    await Promise.all(
      rows.map(async (x) => {
        if (!discountMap[x.discount_id]) {
          discountMap[x.discount_id] = [];
        }
        discountMap[x.discount_id].push(x);
      })
    );

    return keys.map((key) => discountMap[key] || []);
  });
}
