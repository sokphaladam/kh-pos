import { table_product_lot } from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import DataLoader from "dataloader";
import { Knex } from "knex";

export interface ProductLot {
  id: string;
  variantId: string;
  lotNumber?: string;
  expiredDate?: string;
  manufacturingDate?: string;
  costPerUnit?: string;
  createdAt?: string;
}

export function createProductLot(db: Knex) {
  return new DataLoader(async (keys: readonly string[]) => {
    const rows = await db
      .table<table_product_lot>("product_lot")
      .whereIn("id", keys)
      .select();

    return keys.map((key) => {
      const row = rows.find((r) => r.id === key);
      if (!row) return null;
      return {
        id: row.id || "",
        variantId: row.variant_id,
        lotNumber: row.lot_number,
        expiredDate: row.expiration_date
          ? Formatter.date(row.expiration_date)
          : null,
        manufacturingDate: row.manufacturing_date
          ? Formatter.date(row.manufacturing_date)
          : null,
        costPerUnit: row.cost_per_unit,
        createdAt: row.created_at ? Formatter.dateTime(row.created_at) : null,
      } as ProductLot;
    });
  });
}
