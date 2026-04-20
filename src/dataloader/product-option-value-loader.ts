import { Knex } from "knex";
import Dataloader from "dataloader";
import { table_product_option_value } from "@/generated/tables";
import { ProductOptionValue } from "@/app/api/product/[id]/option/types";

export function createProductOptionValueLoader(db: Knex) {
  return new Dataloader(async (keys: readonly string[]) => {
    const rows: table_product_option_value[] = await db
      .table("product_option_value")
      .whereIn("product_option_id", keys);

    const productOptionValueMap: Record<string, ProductOptionValue[]> = {};

    rows.forEach((row) => {
      const optionValue = mapProductOptionValue(row);
      if (productOptionValueMap[row.product_option_id!]) {
        productOptionValueMap[row.product_option_id!].push(optionValue);
      } else {
        productOptionValueMap[row.product_option_id!] = [optionValue];
      }
    });
    return keys.map((key) => productOptionValueMap[key] || []);
  });
}

function mapProductOptionValue(
  row: table_product_option_value
): ProductOptionValue {
  return {
    id: row.id!,
    value: row.value,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
