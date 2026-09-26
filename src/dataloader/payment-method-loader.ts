import { table_payment_method } from "@/generated/tables";
import DataLoader from "dataloader";
import { Knex } from "knex";

export function createPaymentMethodLoader(
  db: Knex,
): DataLoader<string, table_payment_method | null> {
  return new DataLoader(async (keys: readonly string[]) => {
    const rows: table_payment_method[] = await db
      .table<table_payment_method>("payment_method")
      .whereIn("method_id", keys);

    const rowById = new Map(rows.map((r) => [r.method_id, r]));
    return keys.map((key) => rowById.get(key) ?? null);
  });
}
