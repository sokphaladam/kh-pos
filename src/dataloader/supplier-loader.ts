import { table_supplier } from "@/generated/tables";
import { Supplier } from "@/lib/server-functions/supplier";
import DataLoader from "dataloader";
import { Knex } from "knex";

export function createSupplierLoader(db: Knex) {
  return new DataLoader(async (keys: readonly string[]) => {
    const rows: table_supplier[] = await db
      .table<table_supplier>("supplier")
      .whereIn("id", keys);

    const result: Supplier[] = keys.map((key) => {
      const row = rows.find((f) => f.id === key);
      return {
        id: row?.id || "",
        name: row?.name || "",
        address: row?.address || "",
        updatedAt: row?.updated_at || "",
        note: row?.note || "",
        contactEmail: row?.contact_email || "",
        contactName: row?.contact_name || "",
        contactPhone: row?.contact_phone || "",
        isConsignment: row?.is_consignment === 1,
        createdAt: row?.created_at || "",
      };
    });

    return result;
  });
}
